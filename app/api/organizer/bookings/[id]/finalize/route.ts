


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus, NotificationType, PayoutStatus, TransactionType, TransactionStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * Helper function to create TALENT_PAYOUT transaction
 * Prevents duplicate payout creation and handles errors gracefully
 */
async function createTalentPayoutTransaction(bookingId: string, talentId: string, amount: number, eventTitle: string) {
  try {
    // Check if TALENT_PAYOUT transaction already exists for this booking
    const existingPayout = await prisma.transaction.findFirst({
      where: {
        bookingId: bookingId,
        userId: talentId,
        type: TransactionType.TALENT_PAYOUT
      }
    })

    if (existingPayout) {
      console.log(`TALENT_PAYOUT transaction already exists for booking ${bookingId}`)
      return existingPayout
    }

    // Create new TALENT_PAYOUT transaction
    const payoutTransaction = await prisma.transaction.create({
      data: {
        bookingId: bookingId,
        userId: talentId,
        type: TransactionType.TALENT_PAYOUT,
        status: TransactionStatus.PENDING,
        amount: amount,
        currency: 'KES',
        description: `Payout for ${eventTitle}`,
        metadata: {
          createdBy: 'organizer_finalize',
          reason: 'booking_completion',
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`✅ Created TALENT_PAYOUT transaction ${payoutTransaction.id} for booking ${bookingId}`)
    return payoutTransaction

  } catch (error) {
    console.error(`❌ Failed to create TALENT_PAYOUT transaction for booking ${bookingId}:`, error)
    // Don't throw error - booking completion should not fail if payout creation fails
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Only organizers can finalize bookings' }, { status: 401 })
    }

    const body = await request.json()
    const { action, review } = body

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { 
        id: params.id,
        organizerId: session.user.id
      },
      include: {
        Event: true,
        User_Booking_talentIdToUser: true,
        Review: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    // Check if event has ended
    const eventEndTime = booking.eventEndDateTime 
      ? new Date(booking.eventEndDateTime)
      : new Date(booking.Event.eventDate.getTime() + (booking.Event.duration || 0) * 60 * 60 * 1000)
    const now = new Date()
    if (eventEndTime > now) {
      return NextResponse.json(
        { error: 'Cannot finalize booking before event ends' },
        { status: 400 }
      )
    }

    // Check if booking is in the right status
    if (booking.status !== BookingStatus.IN_PROGRESS && booking.status !== BookingStatus.ACCEPTED) {
      return NextResponse.json(
        { error: 'Can only finalize bookings that are accepted or in progress' },
        { status: 400 }
      )
    }

    if (action === 'submit_review') {
      return await handleSubmitReview(params.id, session.user.id, review, booking)
    } else if (action === 'complete_booking') {
      return await handleCompleteBooking(params.id, session.user.id, booking)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "submit_review" or "complete_booking"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error finalizing booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to finalize booking' },
      { status: 500 }
    )
  }
}

async function handleSubmitReview(bookingId: string, organizerId: string, review: any, booking: any) {
  // Validate review data
  if (!review || !review.rating || review.rating < 1 || review.rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5' },
      { status: 400 }
    )
  }

  // Comments are optional, but if provided should not be empty
  if (review.comment && review.comment.trim().length === 0) {
    review.comment = null
  }

  // Check if organizer already reviewed this booking
  const existingReview = booking.Review.find((r: any) => r.giverId === organizerId)
  if (existingReview) {
    return NextResponse.json(
      { success: false, error: 'Review already submitted for this booking' },
      { status: 400 }
    )
  }

  try {
    // Create review with isVisible=false (double-blind system)
    const newReview = await prisma.review.create({
      data: {
        bookingId: bookingId,
        giverId: organizerId,
        receiverId: booking.talentId,
        rating: parseInt(review.rating),
        comment: review.comment?.trim() || null,
        reviewerType: 'ORGANIZER',
        isVisible: false // Will be made visible after 48 hours or when both reviews are submitted
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        reviewId: newReview.id,
        rating: newReview.rating
      }
    })

  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}

async function handleCompleteBooking(bookingId: string, organizerId: string, booking: any) {
  // Check if organizer has submitted a review
  const organizerReview = booking.Review.find((r: any) => r.giverId === organizerId)
  if (!organizerReview) {
    return NextResponse.json(
      { error: 'Review must be submitted before completing booking' },
      { status: 400 }
    )
  }

  try {
    // Start transaction to update booking, create payout, and send notifications
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status to completed
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          completedDate: new Date()
        }
      })

      // Create payout record (queue for processing)
      const payout = await tx.payout.create({
        data: {
          talentId: booking.talentId,
          bookingId: bookingId,
          amount: booking.talentAmount,
          status: PayoutStatus.PENDING,
          payoutMethod: 'MPESA'
        }
      })

      return { updatedBooking, payout }
    })

    // Create TALENT_PAYOUT transaction (outside of main transaction to prevent rollback on failure)
    const payoutAmount = Number(booking.talentAmount)
    await createTalentPayoutTransaction(
      bookingId,
      booking.talentId,
      payoutAmount,
      booking.Event.title
    )

    // Create notification for talent about booking completion
    await prisma.notification.create({
      data: {
        userId: booking.talentId,
        type: NotificationType.BOOKING_COMPLETED,
        title: 'Booking Completed',
        message: `Your booking for "${booking.Event.title}" has been completed. Payout is being processed.`,
        bookingId: bookingId,
        actionUrl: `/talent/bookings/${bookingId}`,
      },
    })

    // Create notification for talent to submit their review (48-hour window)
    const reviewDueDate = new Date()
    reviewDueDate.setHours(reviewDueDate.getHours() + 48)
    
    await prisma.notification.create({
      data: {
        userId: booking.talentId,
        type: NotificationType.REVIEW_RECEIVED,
        title: 'Review Request',
        message: `Please review your experience with the organizer for "${booking.Event.title}". You have 48 hours to submit your review.`,
        bookingId: bookingId,
        actionUrl: `/talent/bookings/${bookingId}/review`,
      },
    })

    // Schedule review visibility check after 48 hours
    await scheduleReviewVisibilityCheck(bookingId, reviewDueDate)

    return NextResponse.json({
      success: true,
      message: 'Booking completed successfully',
      data: {
        bookingId: result.updatedBooking.id,
        status: result.updatedBooking.status,
        completedDate: result.updatedBooking.completedDate,
        payoutId: result.payout.id,
        payoutStatus: result.payout.status
      }
    })

  } catch (error) {
    console.error('Error completing booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete booking' },
      { status: 500 }
    )
  }
}

// Helper function to schedule review visibility check
async function scheduleReviewVisibilityCheck(bookingId: string, dueDate: Date) {
  // In a production environment, you would use a job queue system like Bull, Agenda, or similar
  // For now, we'll create a simple database record to track this
  try {
    await prisma.$executeRaw`
      INSERT INTO "ReviewVisibilitySchedule" (booking_id, due_date, created_at)
      VALUES (${bookingId}, ${dueDate}, NOW())
      ON CONFLICT (booking_id) DO UPDATE SET due_date = ${dueDate}
    `
  } catch (error) {
    // If the table doesn't exist, we'll handle this gracefully
    console.log('ReviewVisibilitySchedule table not found, skipping scheduling')
  }
}


