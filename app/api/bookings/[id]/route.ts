

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BookingStatus, NotificationType, UserRole, TransactionType, TransactionStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            location: true,
            eventDate: true,
            duration: true,
            requirements: true,
          },
        },
        User_Booking_organizerIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            OrganizerProfile: {
              select: {
                companyName: true,
                location: true,
                phoneNumber: true,
              },
            },
          },
        },
        User_Booking_talentIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            TalentProfile: {
              select: {
                bio: true,
                category: true,
                location: true,
                phoneNumber: true,
                skills: true,
                experience: true,
              },
            },
          },
        },
        Message: {
          include: {
            User_Message_senderIdToUser: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        Transaction: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has access to this booking
    const hasAccess = booking.organizerId === session.user.id || 
                     booking.talentId === session.user.id ||
                     session.user.role === UserRole.ADMIN

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Format the booking data
    const formattedBooking = {
      id: booking.id,
      status: booking.status,
      amount: Number(booking.amount),
      platformFee: Number(booking.platformFee),
      talentAmount: Number(booking.talentAmount),
      proposedDate: booking.proposedDate,
      acceptedDate: booking.acceptedDate,
      completedDate: booking.completedDate,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      event: booking.Event,
      organizer: {
        ...booking.User_Booking_organizerIdToUser,
        organizerProfile: booking.User_Booking_organizerIdToUser.OrganizerProfile,
      },
      talent: {
        ...booking.User_Booking_talentIdToUser,
        talentProfile: booking.User_Booking_talentIdToUser.TalentProfile,
      },
      messages: booking.Message.map((msg: any) => ({
        ...msg,
        sender: msg.User_Message_senderIdToUser,
      })),
      transactions: booking.Transaction,
    }

    return NextResponse.json({
      success: true,
      data: formattedBooking,
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
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
          createdBy: 'system',
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { action, notes } = await request.json()

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        Event: true,
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        }
      }
    })

    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check permissions
    const isOrganizer = currentBooking.organizerId === session.user.id
    const isTalent = currentBooking.talentId === session.user.id

    if (!isOrganizer && !isTalent && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Define what actions each role can perform
    let updateData: any = {}
    let notificationType: NotificationType | null = null
    let notificationMessage = ''

    switch (action) {
      case 'accept':
        if (!isTalent) {
          return NextResponse.json({ error: 'Only talent can accept bookings' }, { status: 403 })
        }
        if (currentBooking.status !== BookingStatus.PENDING) {
          return NextResponse.json({ error: 'Can only accept pending bookings' }, { status: 400 })
        }
        updateData = { 
          status: BookingStatus.ACCEPTED, 
          acceptedDate: new Date(),
          notes: notes || currentBooking.notes
        }
        notificationType = NotificationType.BOOKING_ACCEPTED
        notificationMessage = `Your booking for "${currentBooking.Event.title}" has been accepted`
        break

      case 'decline':
        if (!isTalent) {
          return NextResponse.json({ error: 'Only talent can decline bookings' }, { status: 403 })
        }
        if (currentBooking.status !== BookingStatus.PENDING) {
          return NextResponse.json({ error: 'Can only decline pending bookings' }, { status: 400 })
        }
        updateData = { 
          status: BookingStatus.DECLINED,
          notes: notes || 'Booking declined by talent'
        }
        notificationType = NotificationType.BOOKING_DECLINED
        notificationMessage = `Your booking for "${currentBooking.Event.title}" has been declined`
        break

      case 'cancel':
        if (currentBooking.status === BookingStatus.COMPLETED) {
          return NextResponse.json({ error: 'Cannot cancel completed bookings' }, { status: 400 })
        }
        updateData = { 
          status: BookingStatus.CANCELLED,
          notes: notes || 'Booking cancelled'
        }
        // Use existing notification type for cancellation
        notificationType = NotificationType.BOOKING_DECLINED
        notificationMessage = `Booking for "${currentBooking.Event.title}" has been cancelled`
        break

      case 'mark_in_progress':
        if (!isTalent && session.user.role !== UserRole.ADMIN) {
          return NextResponse.json({ error: 'Only talent or admin can mark bookings as in progress' }, { status: 403 })
        }
        if (currentBooking.status !== BookingStatus.ACCEPTED) {
          return NextResponse.json({ error: 'Can only mark accepted bookings as in progress' }, { status: 400 })
        }
        updateData = { 
          status: BookingStatus.IN_PROGRESS,
          notes: notes || currentBooking.notes
        }
        notificationType = NotificationType.BOOKING_ACCEPTED
        notificationMessage = `Booking for "${currentBooking.Event.title}" is now in progress`
        break

      case 'complete':
        // Allow organizers, talents, and admins to mark bookings as complete
        if (!isOrganizer && !isTalent && session.user.role !== UserRole.ADMIN) {
          return NextResponse.json({ error: 'Only organizers, talents, or admins can complete bookings' }, { status: 403 })
        }
        if (currentBooking.status !== BookingStatus.IN_PROGRESS && currentBooking.status !== BookingStatus.ACCEPTED) {
          return NextResponse.json({ error: 'Can only complete bookings that are accepted or in progress' }, { status: 400 })
        }
        
        updateData = { 
          status: BookingStatus.COMPLETED,
          completedDate: new Date(),
          notes: notes || currentBooking.notes
        }
        
        // Create TALENT_PAYOUT transaction when booking is completed
        const payoutAmount = Number(currentBooking.talentAmount || currentBooking.amount)
        await createTalentPayoutTransaction(
          currentBooking.id,
          currentBooking.talentId,
          payoutAmount,
          currentBooking.Event.title
        )
        
        notificationType = NotificationType.BOOKING_COMPLETED
        notificationMessage = `Booking for "${currentBooking.Event.title}" has been completed. ${isTalent ? 'Your payout is being processed.' : 'Talent payout is being processed.'}`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        Event: {
          select: {
            title: true,
            category: true,
          },
        },
        User_Booking_organizerIdToUser: {
          select: {
            name: true,
            email: true,
          },
        },
        User_Booking_talentIdToUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Send notification to the other party
    if (notificationType && notificationMessage) {
      const otherUserId = isTalent ? currentBooking.organizerId : currentBooking.talentId
      
      await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: notificationType,
          title: 'Booking Update',
          message: notificationMessage,
          bookingId: id,
          actionUrl: `/bookings/${id}`,
        },
      })
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: `BOOKING_${action.toUpperCase()}`,
        description: `${action} booking for "${currentBooking.Event.title}"`,
        metadata: { 
          bookingId: id, 
          action,
          previousStatus: currentBooking.status,
          newStatus: updateData.status || currentBooking.status
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Booking ${action}d successfully`,
      data: updatedBooking,
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

