

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus, TransactionStatus, NotificationType, TransactionType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = params.id

    // Get the latest transaction for this booking
    const transaction = await prisma.transaction.findFirst({
      where: { 
        bookingId,
        userId: session.user.id 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Booking: {
          include: {
            User_Booking_talentIdToUser: true,
            User_Booking_organizerIdToUser: true,
            Event: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'No transaction found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      transaction
    })
  } catch (error) {
    console.error('Error fetching booking status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking status' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Only organizers can update bookings' }, { status: 401 })
    }

    const bookingId = params.id
    const updateData = await request.json()

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { 
        id: bookingId,
        organizerId: session.user.id 
      },
      data: updateData,
      include: {
        User_Booking_talentIdToUser: true,
        Event: true,
        transactions: true
      }
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

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
          createdBy: 'organizer',
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
      return NextResponse.json({ error: 'Only organizers can manage bookings' }, { status: 401 })
    }

    const { action, notes } = await request.json()
    const bookingId = params.id

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        organizerId: session.user.id
      },
      include: {
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Event: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let activityDescription = ''

    switch (action) {
      case 'accept':
        if (booking.status !== BookingStatus.PENDING) {
          return NextResponse.json({ error: 'Can only accept pending bookings' }, { status: 400 })
        }

        updateData = {
          status: BookingStatus.ACCEPTED,
          acceptedDate: new Date(),
          notes
        }

        // Notify talent about acceptance
        await prisma.notification.create({
          data: {
            userId: booking.talentId,
            type: NotificationType.BOOKING_ACCEPTED,
            title: 'Booking Accepted',
            message: `Your booking application for "${booking.Event.title}" has been accepted`,
            bookingId,
            actionUrl: `/talent/bookings/${bookingId}`
          }
        })

        activityDescription = `Accepted booking application from ${booking.User_Booking_talentIdToUser.name}`
        break

      case 'decline':
        if (booking.status !== BookingStatus.PENDING) {
          return NextResponse.json({ error: 'Can only decline pending bookings' }, { status: 400 })
        }

        updateData = {
          status: BookingStatus.DECLINED,
          notes: notes || 'Booking declined by organizer'
        }

        activityDescription = `Declined booking application from ${booking.User_Booking_talentIdToUser.name}`
        break

      case 'make_payment':
        if (booking.status !== BookingStatus.ACCEPTED) {
          return NextResponse.json({ error: 'Can only pay for accepted bookings' }, { status: 400 })
        }

        // Create a test transaction record
        await prisma.transaction.create({
          data: {
            bookingId: booking.id,
            userId: session.user.id,
            type: 'BOOKING_PAYMENT',
            amount: Number(booking.amount),
            currency: 'KES',
            status: TransactionStatus.COMPLETED,
            paystackRef: `pay_${Date.now()}_${booking.id}`,
            description: `Payment for ${booking.Event.title}`
          }
        })

        updateData = {
          status: BookingStatus.IN_PROGRESS
        }

        activityDescription = `Made payment for booking with ${booking.User_Booking_talentIdToUser.name}`
        break

      case 'mark_complete':
        if (booking.status !== BookingStatus.IN_PROGRESS) {
          return NextResponse.json({ error: 'Can only complete bookings that are in progress' }, { status: 400 })
        }

        updateData = {
          status: BookingStatus.COMPLETED,
          completedDate: new Date()
        }

        // Create TALENT_PAYOUT transaction when booking is completed
        const payoutAmount = Number(booking.talentAmount || booking.amount)
        await createTalentPayoutTransaction(
          booking.id,
          booking.talentId,
          payoutAmount,
          booking.Event.title
        )

        // Notify talent about booking completion
        await prisma.notification.create({
          data: {
            userId: booking.talentId,
            type: NotificationType.BOOKING_COMPLETED,
            title: 'Booking Completed',
            message: `Your booking for "${booking.Event.title}" has been completed. Payout is being processed.`,
            bookingId: booking.id,
            actionUrl: `/talent/bookings/${booking.id}`,
          },
        })

        activityDescription = `Marked booking with ${booking.User_Booking_talentIdToUser.name} as complete`
        break

      case 'cancel':
        if (booking.status === BookingStatus.COMPLETED) {
          return NextResponse.json({ error: 'Cannot cancel completed bookings' }, { status: 400 })
        }

        updateData = {
          status: BookingStatus.CANCELLED,
          notes: notes || 'Booking cancelled by organizer'
        }

        activityDescription = `Cancelled booking with ${booking.User_Booking_talentIdToUser.name}`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update booking with proper data structure
    const updatedBooking = await prisma.booking.update({
      where: { 
        id: bookingId,
        organizerId: session.user.id // Ensure the user owns this booking
      },
      data: {
        ...updateData,
        // Ensure we don't include any unexpected fields
        updatedAt: new Date()
      },
      include: {
        User_Booking_talentIdToUser: true,
        Event: true,
        transactions: true
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: `BOOKING_${action.toUpperCase()}`,
        description: activityDescription,
        metadata: { bookingId, action }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Booking ${action}d successfully`,
      data: updatedBooking
    })

  } catch (error) {
    console.error('Error managing booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to manage booking' },
      { status: 500 }
    )
  }
}

