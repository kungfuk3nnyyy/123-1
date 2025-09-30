
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EventStatus, UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const minBudget = searchParams.get('minBudget')
    const maxBudget = searchParams.get('maxBudget')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    // Build filter conditions
    const whereClause: any = {
      status: status || EventStatus.PUBLISHED,
      User: {
        isActive: true,
        role: UserRole.ORGANIZER
      }
    }

    // Category filter - handle array of categories
    if (category && category !== 'all' && category !== 'ALL') {
      whereClause.category = {
        has: category
      }
    }

    // Location filter
    if (location && location !== 'all' && location !== 'ALL') {
      whereClause.location = { contains: location, mode: 'insensitive' }
    }

    // Search filter
    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { User: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Budget filter
    if (minBudget || maxBudget) {
      whereClause.AND = whereClause.AND || []
      
      if (minBudget) {
        whereClause.AND.push({
          OR: [
            { budgetMin: { gte: parseFloat(minBudget) } },
            { budgetMax: { gte: parseFloat(minBudget) } }
          ]
        })
      }
      
      if (maxBudget) {
        whereClause.AND.push({
          OR: [
            { budgetMin: { lte: parseFloat(maxBudget) } },
            { budgetMax: { lte: parseFloat(maxBudget) } }
          ]
        })
      }
    }

    // Get total count for pagination
    const totalEvents = await prisma.event.count({ where: whereClause })

    // Fetch events with pagination
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        },
        _count: {
          select: {
            Proposal: true
          }
        }
      },
      orderBy: [
        { eventDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip
    })

    // Format events for frontend
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category || [],
      location: event.location,
      eventDate: event.eventDate?.toISOString(),
      budgetMin: event.budgetMin ? Number(event.budgetMin) : null,
      budgetMax: event.budgetMax ? Number(event.budgetMax) : null,
      status: event.status,
      createdAt: event.createdAt?.toISOString(),
      user: {
        id: event.User.id,
        name: event.User.name || 'Event Organizer',
        image: event.User.image,
        email: event.User.email
      },
      _count: {
        Proposal: event._count.Proposal || 0
      }
    }))

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        totalItems: totalEvents,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalEvents / limit),
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json(
        { success: false, error: 'Only organizers can create events' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      location,
      eventDate,
      budgetMin,
      budgetMax,
      requirements
    } = body

    // Validate required fields
    if (!title || !description || !location || !eventDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        category: Array.isArray(category) ? category : [category].filter(Boolean),
        location,
        eventDate: new Date(eventDate),
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        requirements: requirements || null,
        status: EventStatus.PUBLISHED,
        organizerId: session.user.id
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            Proposal: true
          }
        }
      }
    })

    // Format the response
    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category || [],
      location: event.location,
      eventDate: event.eventDate?.toISOString(),
      budgetMin: event.budgetMin ? Number(event.budgetMin) : null,
      budgetMax: event.budgetMax ? Number(event.budgetMax) : null,
      status: event.status,
      createdAt: event.createdAt?.toISOString(),
      user: {
        id: event.User.id,
        name: event.User.name || 'Event Organizer',
        image: event.User.image
      },
      _count: {
        Proposal: event._count.Proposal || 0
      }
    }

    return NextResponse.json({
      success: true,
      event: formattedEvent
    })

  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
