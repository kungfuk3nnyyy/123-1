
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole, AvailabilityStatus } from '@prisma/client'
import { 
  getTalentAvailability, 
  upsertAvailability, 
  generateRecurringAvailability 
} from '@/lib/availability'

export const dynamic = 'force-dynamic'

// GET - Fetch talent availability
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const talentId = searchParams.get('talentId')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Determine which talent's availability to fetch
    let targetTalentId: string
    
    if (talentId) {
      // Organizer requesting specific talent's availability
      if (session.user.role !== UserRole.ORGANIZER) {
        return NextResponse.json({ error: 'Only organizers can view other talents availability' }, { status: 403 })
      }
      targetTalentId = talentId
    } else {
      // Talent requesting their own availability
      if (session.user.role !== UserRole.TALENT) {
        return NextResponse.json({ error: 'Talent ID is required for non-talent users' }, { status: 400 })
      }
      targetTalentId = session.user.id
    }

    const availability = await getTalentAvailability(
      targetTalentId,
      new Date(startDate),
      new Date(endDate)
    )

    return NextResponse.json({
      success: true,
      data: availability
    })

  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update availability
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Only talents can manage availability' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      startDate,
      endDate,
      status,
      isRecurring,
      recurringPattern,
      recurringDays,
      notes,
      generateUntil
    } = body

    // Validate required fields
    if (!startDate || !endDate || !status) {
      return NextResponse.json(
        { error: 'Start date, end date, and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    if (!Object.values(AvailabilityStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid availability status' },
        { status: 400 }
      )
    }

    const startDateTime = new Date(startDate)
    const endDateTime = new Date(endDate)

    // Validate date range
    if (startDateTime >= endDateTime) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Handle recurring availability
    if (isRecurring && recurringDays && recurringDays.length > 0 && generateUntil) {
      const result = await generateRecurringAvailability(
        session.user.id,
        {
          startDate: startDateTime,
          endDate: endDateTime,
          status,
          recurringPattern: recurringPattern || 'weekly',
          recurringDays,
          notes
        },
        new Date(generateUntil)
      )

      return NextResponse.json({
        success: true,
        message: `Generated ${result.count} recurring availability entries`,
        data: result
      })
    }

    // Create or update single availability entry
    const availability = await upsertAvailability(session.user.id, {
      id,
      startDate: startDateTime,
      endDate: endDateTime,
      status,
      isRecurring: isRecurring || false,
      recurringPattern,
      recurringDays,
      notes
    })

    return NextResponse.json({
      success: true,
      message: id ? 'Availability updated successfully' : 'Availability created successfully',
      data: availability
    })

  } catch (error) {
    console.error('Error creating/updating availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
