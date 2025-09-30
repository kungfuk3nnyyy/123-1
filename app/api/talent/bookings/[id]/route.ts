
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'
import { NotificationTriggers } from '@/lib/notification-service'

// Common include pattern for booking queries
const bookingInclude = {
  Event: true,
  User_Booking_organizerIdToUser: {
    include: {
      OrganizerProfile: true
    }
  },
  User_Booking_talentIdToUser: {
    include: {
      TalentProfile: true
    }
  },
  Review: true
}

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        talentId: session.user.id
      },
      include: bookingInclude
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        talentId: session.user.id
      },
      include: bookingInclude
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Validate status transitions
    if (booking.status !== BookingStatus.PENDING) {
      return NextResponse.json({ 
        error: 'Only pending bookings can be accepted or declined' 
      }, { status: 400 })
    }

    if (![BookingStatus.ACCEPTED, BookingStatus.DECLINED].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Only ACCEPTED or DECLINED allowed.' 
      }, { status: 400 })
    }

    let updatedBooking
    let activityDescription

    // Prepare update data
    const updateData: any = { status }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (status === BookingStatus.ACCEPTED) {
      updateData.acceptedDate = new Date()
      activityDescription = `Accepted booking for ${booking.Event.title}`
      
      // Trigger notification for organizer
      NotificationTriggers.onBookingAccepted(params.id).catch(err => 
        console.error('Failed to trigger booking accepted notification:', err)
      )
    } else if (status === BookingStatus.DECLINED) {
      activityDescription = `Declined booking for ${booking.Event.title}`
      
      // Trigger notification for organizer
      NotificationTriggers.onBookingDeclined(params.id).catch(err => 
        console.error('Failed to trigger booking declined notification:', err)
      )
    }

    updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData
    })

    // Log activity for talent
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'BOOKING_UPDATED',
        description: activityDescription || 'Updated booking',
        metadata: { bookingId: booking.id, status, notes: notes || null }
      }
    })

    return NextResponse.json({ success: true, data: updatedBooking })
  } catch (error) {
    console.error('Update talent booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
