
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DisputeReason, DisputeStatus, UserRole, NotificationType } from '@prisma/client'
import { createNotification } from '@/lib/notification-service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason, explanation } = await request.json()

    if (!reason || !explanation) {
      return NextResponse.json(
        { error: 'Reason and explanation are required' },
        { status: 400 }
      )
    }

    // Get the booking with all relations
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        Event: true,
        User_Booking_organizerIdToUser: true,
        User_Booking_talentIdToUser: true,
        Dispute: true
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user is part of this booking
    const isOrganizer = booking.organizerId === session.user.id
    const isTalent = booking.talentId === session.user.id

    if (!isOrganizer && !isTalent) {
      return NextResponse.json(
        { error: 'You are not authorized to dispute this booking' },
        { status: 403 }
      )
    }

    // Check if there's already an active dispute
    const existingDispute = booking.Dispute.find((dispute: any) => dispute.status === DisputeStatus.OPEN || dispute.status === DisputeStatus.UNDER_REVIEW)
    if (existingDispute) {
      return NextResponse.json(
        { error: 'A dispute is already active for this booking' },
        { status: 400 }
      )
    }

    // Validate that event date has passed (only allow disputes after event date)
    const now = new Date()
    if (booking.Event.eventDate > now) {
      return NextResponse.json(
        { success: false, error: 'Disputes can only be raised after the event date' },
        { status: 400 }
      )
    }

    // Role-based reason validation with proper type checking
    const organizerReasons = [DisputeReason.TALENT_NO_SHOW, DisputeReason.SERVICE_NOT_AS_DESCRIBED, DisputeReason.UNPROFESSIONAL_CONDUCT, DisputeReason.OTHER]
    const talentReasons = [DisputeReason.ORGANIZER_UNRESPONSIVE, DisputeReason.SCOPE_DISAGREEMENT, DisputeReason.UNSAFE_ENVIRONMENT, DisputeReason.OTHER]
    
    const validReasons = session.user.role === UserRole.ORGANIZER ? organizerReasons : talentReasons

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid dispute reason for your role' },
        { status: 400 }
      )
    }

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        bookingId: params.id,
        disputedById: session.user.id,
        reason: reason as DisputeReason,
        explanation,
        status: DisputeStatus.OPEN,
      },
      include: {
        Booking: {
          include: {
            Event: true,
            User_Booking_organizerIdToUser: true,
            User_Booking_talentIdToUser: true,
          },
        },
        User: true,
      },
    })

    // Update booking status to disputed
    await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'DISPUTED' },
    })

    // Create notifications for both parties using the notification service
    const otherUserId = isOrganizer ? booking.talentId : booking.organizerId
    const otherUserName = isOrganizer 
      ? booking.User_Booking_talentIdToUser.name 
      : booking.User_Booking_organizerIdToUser.name

    // Notify the other party
    await createNotification({
      userId: otherUserId,
      type: NotificationType.DISPUTE_CREATED,
      title: 'Dispute Raised',
      message: `A dispute has been raised for booking "${booking.Event.title}" by ${session.user.name}. Reason: ${reason.replace(/_/g, ' ')}`,
      bookingId: params.id,
      actionUrl: `/${isOrganizer ? 'talent' : 'organizer'}/disputes`,
    })

    // Notify all admins using the notification service
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    })

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: NotificationType.DISPUTE_CREATED,
        title: 'New Dispute Requires Review',
        message: `A dispute has been raised for "${booking.Event.title}" by ${session.user.name} (${session.user.role}). Reason: ${reason.replace(/_/g, ' ')}`,
        bookingId: params.id,
        actionUrl: `/admin/disputes/${dispute.id}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Dispute raised successfully',
      data: {
        disputeId: dispute.id,
        status: dispute.status,
        reason: dispute.reason,
        explanation: dispute.explanation,
        createdAt: dispute.createdAt,
      },
    })
  } catch (error) {
    console.error('Error raising dispute:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to raise dispute' },
      { status: 500 }
    )
  }
}
