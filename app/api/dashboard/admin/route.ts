

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, DisputeStatus, BookingStatus, PayoutStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get total bookings
    const totalBookings = await prisma.booking.count()

    // Calculate total revenue from completed bookings
    const completedBookingsData = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED
      },
      select: {
        amount: true,
        platformFee: true
      }
    })

    const totalRevenue = completedBookingsData.reduce((sum: number, booking: any) => sum + Number(booking.amount), 0)
    const platformFees = completedBookingsData.reduce((sum: number, booking: any) => sum + Number(booking.platformFee), 0)

    // Get pending payouts
    const pendingPayoutsData = await prisma.payout.aggregate({
      where: {
        status: PayoutStatus.PENDING
      },
      _sum: {
        amount: true
      }
    })

    const pendingPayouts = Number(pendingPayoutsData._sum.amount || 0)

    // Get active events
    const activeEvents = await prisma.event.count({
      where: {
        isActive: true,
        eventDate: {
          gte: new Date()
        }
      }
    })

    // Get active disputes
    const activeDisputes = await prisma.dispute.count({
      where: {
        status: {
          in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW]
        }
      }
    })

    // Calculate monthly growth
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Users growth
    const usersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    })

    // Bookings growth
    const bookingsThisMonth = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    const bookingsLastMonth = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    })

    // Revenue growth
    const revenueThisMonth = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        updatedAt: {
          gte: startOfMonth
        }
      },
      select: {
        amount: true
      }
    })

    const revenueLastMonth = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        updatedAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      select: {
        amount: true
      }
    })

    const revenueThisMonthTotal = revenueThisMonth.reduce((sum: number, booking: any) => sum + Number(booking.amount), 0)
    const revenueLastMonthTotal = revenueLastMonth.reduce((sum: number, booking: any) => sum + Number(booking.amount), 0)

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalRevenue,
        platformFees,
        pendingPayouts,
        activeEvents,
        activeDisputes,
        monthlyGrowth: {
          users: usersLastMonth > 0 ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100) : 0,
          bookings: bookingsLastMonth > 0 ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100) : 0,
          revenue: revenueLastMonthTotal > 0 ? Math.round(((revenueThisMonthTotal - revenueLastMonthTotal) / revenueLastMonthTotal) * 100) : 0
        }
      }
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
