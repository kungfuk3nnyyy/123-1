

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BookingStatus, ReviewerType, UserRole, NotificationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.TALENT) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    const bookingId = params.id
    const body = await request.json()
    const { rating, comment } = body

    // Validate input - rating is required, comment is optional
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Find the booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        talentId: session.user.id
      },
      include: {
        Event: true,
        User_Booking_organizerIdToUser: true,
        Review: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if booking is completed
    if (booking.status !== BookingStatus.COMPLETED) {
      return NextResponse.json(
        { success: false, error: 'Booking must be completed to leave a review' },
        { status: 400 }
      )
    }

    // Check if talent already reviewed this booking
    const existingReview = booking.Review.find((r: any) => 
      r.giverId === session.user.id && r.reviewerType === ReviewerType.TALENT
    )
    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review already submitted for this booking' },
        { status: 400 }
      )
    }

    // Create the review with isVisible=false (double-blind system)
    const newReview = await prisma.review.create({
      data: {
        bookingId: booking.id,
        giverId: session.user.id,
        receiverId: booking.organizerId,
        rating: parseInt(rating),
        comment: comment?.trim() || null,
        reviewerType: ReviewerType.TALENT,
        isVisible: false // Will be made visible after 48 hours or when both reviews exist
      }
    })

    // Send notification to organizer
    await prisma.notification.create({
      data: {
        userId: booking.organizerId,
        type: NotificationType.REVIEW_RECEIVED,
        title: 'Review Received',
        message: `${session.user.name || 'A talent'} has submitted a review for "${booking.Event.title}".`,
        bookingId: booking.id,
        actionUrl: `/organizer/bookings/${booking.id}`
      }
    })

    // Check if both reviews exist and handle visibility
    await checkAndHandleReviewVisibility(booking.id)

    return NextResponse.json({
      success: true,
      data: { reviewId: newReview.id },
      message: 'Review submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting talent review:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Enhanced function to handle double-blind review system with 48-hour window
async function checkAndHandleReviewVisibility(bookingId: string) {
  const reviews = await prisma.review.findMany({
    where: { bookingId }
  })

  const organizerReview = reviews.find(r => r.reviewerType === ReviewerType.ORGANIZER)
  const talentReview = reviews.find(r => r.reviewerType === ReviewerType.TALENT)

  // If both reviews exist, make them visible immediately
  if (organizerReview && talentReview) {
    await makeReviewsVisible(bookingId)
  }
  // If only one review exists, they will be made visible after 48 hours
  // This is handled by a background job or cron task
}

// Helper function to make reviews visible and update ratings
async function makeReviewsVisible(bookingId: string) {
  try {
    // Make all reviews for this booking visible
    await prisma.review.updateMany({
      where: { bookingId },
      data: { isVisible: true }
    })

    // Get booking details for notifications
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { Event: true }
    })

    if (booking) {
      // Notify both parties that reviews are now visible
      await prisma.notification.create({
        data: {
          userId: booking.organizerId,
          type: NotificationType.REVIEW_RECEIVED,
          title: 'Reviews Published',
          message: `Reviews for "${booking.Event.title}" are now visible on both profiles.`,
          bookingId: booking.id,
          actionUrl: `/organizer/bookings/${booking.id}`
        }
      })

      await prisma.notification.create({
        data: {
          userId: booking.talentId,
          type: NotificationType.REVIEW_RECEIVED,
          title: 'Reviews Published',
          message: `Reviews for "${booking.Event.title}" are now visible on both profiles.`,
          bookingId: booking.id,
          actionUrl: `/talent/bookings/${booking.id}`
        }
      })

      // Update talent and organizer ratings
      await updateTalentRating(booking.talentId)
      await updateOrganizerRating(booking.organizerId)
    }
  } catch (error) {
    console.error('Error making reviews visible:', error)
  }
}

// Helper function to update talent average rating
async function updateTalentRating(talentId: string) {
  const visibleReviews = await prisma.review.findMany({
    where: {
      receiverId: talentId,
      isVisible: true
    }
  })

  if (visibleReviews.length > 0) {
    const averageRating = visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length
    
    await prisma.talentProfile.update({
      where: { userId: talentId },
      data: {
        averageRating: averageRating,
        totalReviews: visibleReviews.length
      }
    })
  }
}

// Helper function to update organizer average rating
async function updateOrganizerRating(organizerId: string) {
  const visibleReviews = await prisma.review.findMany({
    where: {
      receiverId: organizerId,
      isVisible: true
    }
  })

  if (visibleReviews.length > 0) {
    const averageRating = visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length
    
    await prisma.organizerProfile.upsert({
      where: { userId: organizerId },
      update: {
        averageRating: averageRating
      },
      create: {
        userId: organizerId,
        averageRating: averageRating
      }
    })
  }
}

