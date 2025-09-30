

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface UserData {
  createdAt: Date
  role: UserRole
}

interface DateCounts {
  total: number
  talents: number
  organizers: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    // Get user registrations by day
    const registrations = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      },
      select: {
        createdAt: true,
        role: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group registrations by date
    const registrationsByDate = new Map<string, DateCounts>()
    
    // Initialize all dates in range with zero values
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      registrationsByDate.set(dateKey, { total: 0, talents: 0, organizers: 0 })
    }

    // Count registrations by date
    registrations.forEach((user: UserData) => {
      const dateKey = user.createdAt.toISOString().split('T')[0]
      const existing = registrationsByDate.get(dateKey) || { total: 0, talents: 0, organizers: 0 }
      
      existing.total += 1
      if (user.role === UserRole.TALENT) {
        existing.talents += 1
      } else if (user.role === UserRole.ORGANIZER) {
        existing.organizers += 1
      }
      
      registrationsByDate.set(dateKey, existing)
    })

    // Convert to array format for charts
    const timelineData = Array.from(registrationsByDate.entries()).map(([date, counts]: [string, DateCounts]) => ({
      date,
      total: counts.total,
      talents: counts.talents,
      organizers: counts.organizers,
      formattedDate: new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }))

    return NextResponse.json({ 
      success: true, 
      data: {
        timeline: timelineData,
        summary: {
          totalRegistrations: registrations.length,
          totalTalents: registrations.filter((u: UserData) => u.role === UserRole.TALENT).length,
          totalOrganizers: registrations.filter((u: UserData) => u.role === UserRole.ORGANIZER).length,
          period: `${days} days`
        }
      }
    })

  } catch (error) {
    console.error('Registration analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
