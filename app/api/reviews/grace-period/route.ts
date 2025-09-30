
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ReviewerType, NotificationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job to process 14-day grace period
    const authHeader = request.headers.get('authorization')
    
    // Simple API key protection (in production, use proper authentication)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Processing 14-day grace period for reviews...')

    // Find reviews that are not visible and are older than 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const eligibleReviews = await prisma.review.findMany({
      where: {
        isVisible: false,
        createdAt: {
          lte: fourteenDaysAgo
        }
      },
      include: {
        Booking: {
          include: {
            Event: true
          }
        }
      }
    })

    console.log(`Found ${eligibleReviews.length} reviews eligible for grace period reveal`)

    let processedCount = 0

    for (const review of eligibleReviews) {
      const bookingId = review.bookingId
      
      // Check if there's a corresponding review from the other party
      const otherReviewerType = review.reviewerType === ReviewerType.ORGANIZER ? ReviewerType.TALENT : ReviewerType.ORGANIZER
      const otherReview = await prisma.review.findFirst({
        where: {
          bookingId: bookingId,
          reviewerType: otherReviewerType
        }
      })

      // If no corresponding review exists, make this review visible
      if (!otherReview) {
        await prisma.review.update({
          where: { id: review.id },
          data: { isVisible: true }
        })

        // Send notification to the reviewer that their review is now visible
        await prisma.notification.create({
          data: {
            userId: review.giverId,
            type: NotificationType.REVIEW_RECEIVED,
            title: 'Review Published',
            message: `Your review for "${review.Booking.Event.title}" is now visible. The other party did not submit a review within 14 days.`,
            bookingId: bookingId,
            actionUrl: review.reviewerType === ReviewerType.ORGANIZER ? `/organizer/bookings/${bookingId}` : `/talent/bookings/${bookingId}`
          }
        })

        // Update ratings based on the newly visible review
        if (review.reviewerType === ReviewerType.ORGANIZER) {
          // Organizer reviewed talent, update talent rating
          await updateTalentRating(review.receiverId)
        } else {
          // Talent reviewed organizer, update organizer rating
          await updateOrganizerRating(review.receiverId)
        }

        processedCount++
        console.log(`Made review ${review.id} visible after 14-day grace period`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processedReviews: processedCount,
        totalEligible: eligibleReviews.length
      },
      message: `Processed ${processedCount} reviews under 14-day grace period`
    })

  } catch (error) {
    console.error('Error processing 14-day grace period:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
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
