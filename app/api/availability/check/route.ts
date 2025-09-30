
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { checkTalentAvailability } from '@/lib/availability'

export const dynamic = 'force-dynamic'

// POST - Check talent availability for booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { talentId, startDate, endDate } = body

    // Validate required fields
    if (!talentId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Talent ID, start date, and end date are required' },
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

    const availabilityCheck = await checkTalentAvailability(
      talentId,
      startDateTime,
      endDateTime
    )

    return NextResponse.json({
      success: true,
      data: availabilityCheck
    })

  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
