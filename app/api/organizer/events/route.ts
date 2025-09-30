import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // GET logic remains the same...
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    const events = await prisma.event.findMany({
      where: { organizerId: session.user.id },
      include: {
        User: {
          include: {
            OrganizerProfile: true
          }
        },
        _count: {
          select: {
            Booking: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    })

    const totalEvents = await prisma.event.count({
      where: { organizerId: session.user.id }
    })

    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      eventDate: event.eventDate,
      duration: event.duration,
      requirements: event.requirements,
      budget: event.budget ? Number(event.budget) : null,
      isPublic: event.isPublic,
      isActive: event.isActive,
      createdAt: event.createdAt,
      organizer: {
        ...event.User,
        organizerProfile: event.User.OrganizerProfile
      },
      bookingsCount: event._count.Booking
    }))

    return NextResponse.json({
      success: true,
      data: {
        events: formattedEvents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalEvents / limit),
          totalItems: totalEvents,
          itemsPerPage: limit
        }
      }
    })
  } catch (error) {
    console.error('Error fetching organizer events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Only organizers can create events' }, { status: 401 })
    }

    const {
      title,
      description,
      categories, // **CHANGED**: Expect 'categories' (plural)
      location,
      eventDate,
      duration,
      requirements,
      budget,
      isPublic = true
    } = await request.json()

    // **CHANGED**: Updated validation to check for a non-empty categories array
    if (!title || !description || !categories || categories.length === 0 || !location || !eventDate) {
      return NextResponse.json(
        { error: 'Title, description, categories, location, and event date are required' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        organizerId: session.user.id,
        title,
        description,
        category: categories, // **CHANGED**: Save the array of categories
        location,
        eventDate: new Date(eventDate),
        duration: duration ? parseInt(duration) : null,
        requirements,
        budget: budget ? parseFloat(budget) : null,
        isPublic,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      data: event
    })

  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    )
  }
}