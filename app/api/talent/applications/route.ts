import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'
import { createNotification } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const talentId = session.user.id;

    // 1. Find the event to get organizerId and budget
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // 2. Check if an application (booking) already exists
    const existingBooking = await prisma.booking.findFirst({
      where: {
        eventId: eventId,
        talentId: talentId,
      },
    })

    if (existingBooking) {
      return NextResponse.json({ error: 'You have already applied for this event' }, { status: 409 })
    }

    // 3. Calculate amounts
    const grossAmount = event.budget || 0;
    const grossAmountNum = typeof grossAmount === 'number' ? grossAmount : Number(grossAmount);
    const platformFee = grossAmountNum * 0.10; // 10% platform fee
    const talentAmount = grossAmountNum - platformFee;

    // 4. Create the new booking with PENDING status (this is the application)
    const newBooking = await prisma.booking.create({
      data: {
        eventId: event.id,
        organizerId: event.organizerId,
        talentId: talentId,
        status: BookingStatus.PENDING,
        amount: grossAmount,
        platformFee: platformFee,
        talentAmount: talentAmount,
        proposedDate: event.eventDate,
      },
    })

    // 5. Notify the organizer about the new application
    await createNotification({
      userId: event.organizerId,
      type: 'BOOKING_REQUEST',
      title: 'New Event Application',
      message: `${session.user.name || 'A talent'} has applied for your event "${event.title}".`,
      bookingId: newBooking.id,
      actionUrl: `/organizer/events/${event.id}/applicants`,
    })

    return NextResponse.json({ success: true, data: newBooking })

  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}