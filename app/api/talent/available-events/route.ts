import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all bookings made by the current talent
    const existingBookings = await prisma.booking.findMany({
      where: { talentId: session.user.id },
      select: { eventId: true },
    })
    const bookedEventIds = existingBookings.map(b => b.eventId);

    // Fetch all public, active events that are not in the talent's booked list
    const availableEvents = await prisma.event.findMany({
      where: {
        isPublic: true,
        isActive: true,
        eventDate: {
          gte: new Date(), // Only show future events
        },
        id: {
          notIn: bookedEventIds, // Exclude events already applied to
        },
      },
      include: {
        User: { // The organizer who created the event
          select: {
            name: true,
            OrganizerProfile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: availableEvents })

  } catch (error) {
    console.error('Error fetching available events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available events' },
      { status: 500 }
    )
  }
}