

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface BookingData {
  updatedAt: Date
  amount: any
  platformFee: any
}

interface AllBookingData {
  createdAt: Date
  status: BookingStatus
  amount: any
}

interface DateCounts {
  completed: number
  created: number
  revenue: number
  fees: number
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

    // Get booking completions by day
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        updatedAt: true,
        amount: true,
        platformFee: true
      },
      orderBy: {
        updatedAt: 'asc'
      }
    })

    // Get all bookings created in period for comparison
    const allBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        status: true,
        amount: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group bookings by date
    const bookingsByDate = new Map<string, DateCounts>()
    
    // Initialize all dates in range with zero values
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      bookingsByDate.set(dateKey, { completed: 0, created: 0, revenue: 0, fees: 0 })
    }

    // Count completed bookings by date
    completedBookings.forEach((booking: BookingData) => {
      const dateKey = booking.updatedAt.toISOString().split('T')[0]
      const existing = bookingsByDate.get(dateKey) || { completed: 0, created: 0, revenue: 0, fees: 0 }
      
      existing.completed += 1
      existing.revenue += Number(booking.amount)
      existing.fees += Number(booking.platformFee)
      
      bookingsByDate.set(dateKey, existing)
    })

    // Count created bookings by date
    allBookings.forEach((booking: AllBookingData) => {
      const dateKey = booking.createdAt.toISOString().split('T')[0]
      const existing = bookingsByDate.get(dateKey) || { completed: 0, created: 0, revenue: 0, fees: 0 }
      
      existing.created += 1
      
      bookingsByDate.set(dateKey, existing)
    })

    // Convert to array format for charts
    const timelineData = Array.from(bookingsByDate.entries()).map(([date, counts]: [string, DateCounts]) => ({
      date,
      completed: counts.completed,
      created: counts.created,
      revenue: counts.revenue,
      fees: counts.fees,
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
          totalCompleted: completedBookings.length,
          totalCreated: allBookings.length,
          totalRevenue: completedBookings.reduce((sum: number, b: BookingData) => sum + Number(b.amount), 0),
          totalFees: completedBookings.reduce((sum: number, b: BookingData) => sum + Number(b.platformFee), 0),
          completionRate: allBookings.length > 0 ? 
            Math.round((completedBookings.length / allBookings.length) * 100) : 0,
          period: `${days} days`
        }
      }
    })

  } catch (error) {
    console.error('Booking analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
