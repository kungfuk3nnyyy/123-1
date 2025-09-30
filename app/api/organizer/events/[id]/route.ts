import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET a single event for viewing or editing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: {
        id: params.id,
        organizerId: session.user.id,
      },
      include: {
        _count: {
          select: { Booking: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error(`Error fetching event ${params.id}:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// UPDATE an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      title,
      description,
      categories, // Changed from 'category' to 'categories'
      location,
      eventDate,
      requirements,
      budget,
    } = await request.json()

    // Validate the incoming data
    if (!title || !description || !categories || categories.length === 0 || !location || !eventDate || !budget) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { 
        id: params.id,
        organizerId: session.user.id // Security check to ensure ownership
      },
      data: {
        title,
        description,
        category: categories, // Use the 'categories' array
        location,
        eventDate: new Date(eventDate),
        requirements,
        budget: parseFloat(budget),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    })

  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ success: false, error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.event.delete({
      where: { 
        id: params.id,
        organizerId: session.user.id // Security check
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 })
  }
}