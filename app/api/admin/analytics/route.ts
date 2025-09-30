

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'

export const dynamic = "force-dynamic"

interface MonthlyRevenueData {
  month: Date
  revenue: number
  bookings: number
}

interface UserGrowthData {
  month: Date
  talents: number
  organizers: number
}

interface CategoryData {
  category: string | null
  _count: {
    category: number
  } | null
}

interface TopTalentData {
  name: string | null
  TalentProfile: {
    category: string | null
    averageRating: any | null
    totalBookings: number
  } | null
  _count: {
    Booking_Booking_talentIdToUser: number
  } | null
}

interface BookingAggregateResult {
  _sum: {
    amount: any | null
  }
  _count: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '6months'

    // Calculate date ranges
    const now = new Date()
    const periods = {
      '7days': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30days': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '3months': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '6months': new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      '1year': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }

    const startDate = periods[period as keyof typeof periods] || periods['6months']

    // Get monthly revenue data without raw SQL for broader DB compatibility
    const bookingsData = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate },
        status: BookingStatus.COMPLETED,
      },
      select: {
        createdAt: true,
        amount: true,
      },
    });

    // bucket into months
    const revenueMap: Record<string, { revenue: number; bookings: number }> = {};
    bookingsData.forEach((b) => {
      const monthKey = new Date(b.createdAt.getFullYear(), b.createdAt.getMonth(), 1).toISOString();
      if (!revenueMap[monthKey]) {
        revenueMap[monthKey] = { revenue: 0, bookings: 0 };
      }
      revenueMap[monthKey].revenue += Number(b.amount);
      revenueMap[monthKey].bookings += 1;
    });
    const monthlyRevenue: MonthlyRevenueData[] = Object.entries(revenueMap)
      .map(([monthISO, data]) => ({ month: new Date(monthISO), revenue: data.revenue, bookings: data.bookings }))
      .sort((a, b) => a.month.getTime() - b.month.getTime());

    // Get user growth data
    const usersData = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
        role: { not: UserRole.ADMIN },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });
    const userMap: Record<string, { talents: number; organizers: number }> = {};
    usersData.forEach((u) => {
      const monthKey = new Date(u.createdAt.getFullYear(), u.createdAt.getMonth(), 1).toISOString();
      if (!userMap[monthKey]) {
        userMap[monthKey] = { talents: 0, organizers: 0 };
      }
      if (u.role === UserRole.TALENT) userMap[monthKey].talents += 1;
      if (u.role === UserRole.ORGANIZER) userMap[monthKey].organizers += 1;
    });
    const userGrowth: UserGrowthData[] = Object.entries(userMap)
      .map(([monthISO, data]) => ({ month: new Date(monthISO), talents: data.talents, organizers: data.organizers }))
      .sort((a, b) => a.month.getTime() - b.month.getTime());

    // Get category distribution
    const categoryData = await prisma.talentProfile.groupBy({
      by: ['category'],
      _count: { category: true },
      where: {
        User: {
          createdAt: { gte: startDate }
        }
      }
    })

    // Get top performing talents
    const topTalents = await prisma.user.findMany({
      where: {
        role: UserRole.TALENT,
        TalentProfile: {
          isNot: null
        }
      },
      include: {
        TalentProfile: {
          select: {
            category: true,
            averageRating: true,
            totalBookings: true
          }
        },
        _count: {
          select: {
            Booking_Booking_talentIdToUser: {
              where: {
                status: BookingStatus.COMPLETED,
                createdAt: { gte: startDate }
              }
            }
          }
        }
      },
      orderBy: {
        TalentProfile: {
          averageRating: 'desc'
        }
      },
      take: 5
    })

    // Get current month metrics
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [currentStats, previousStats] = await Promise.all([
      prisma.booking.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          createdAt: { gte: currentMonthStart },
          status: BookingStatus.COMPLETED
        }
      }),
      prisma.booking.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          createdAt: { 
            gte: previousMonthStart,
            lte: previousMonthEnd
          },
          status: BookingStatus.COMPLETED
        }
      })
    ])

    // Calculate growth percentages
    const revenueGrowth = previousStats._sum.amount && Number(previousStats._sum.amount) > 0 
      ? (((Number(currentStats._sum.amount || 0) - Number(previousStats._sum.amount)) / Number(previousStats._sum.amount)) * 100).toFixed(1)
      : '0'

    const bookingGrowth = previousStats._count > 0 
      ? (((currentStats._count - previousStats._count) / previousStats._count) * 100).toFixed(1)
      : '0'

    // Get active users count
    const activeUsers = await prisma.user.count({
      where: {
        role: { not: UserRole.ADMIN },
        createdAt: { gte: currentMonthStart }
      }
    })

    const previousActiveUsers = await prisma.user.count({
      where: {
        role: { not: UserRole.ADMIN },
        createdAt: { 
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      }
    })

    const userGrowthPercent = previousActiveUsers > 0 
      ? (((activeUsers - previousActiveUsers) / previousActiveUsers) * 100).toFixed(1)
      : '0'

    // Format data
    const formattedRevenueData = monthlyRevenue.map((item: MonthlyRevenueData) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      revenue: item.revenue,
      bookings: item.bookings
    }))

    const formattedUserGrowth = userGrowth.map((item: UserGrowthData) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      talents: item.talents,
      organizers: item.organizers
    }))

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    const formattedCategoryData = categoryData.map((item: CategoryData, index: number) => ({
      name: item.category || 'Unknown',
      value: Math.round(((item._count?.category || 0) / categoryData.reduce((sum: number, cat: CategoryData) => sum + (cat._count?.category || 0), 0)) * 100),
      color: colors[index % colors.length]
    }))

    const formattedTopTalents = topTalents.map((talent: TopTalentData) => ({
      name: talent.name || 'Unknown',
      category: talent.TalentProfile?.category || 'Unknown',
      rating: Number(talent.TalentProfile?.averageRating || 0),
      bookings: talent._count?.Booking_Booking_talentIdToUser || 0
    }))

    // Calculate success rate
    const totalBookings = await prisma.booking.count()
    const completedBookings = await prisma.booking.count({ where: { status: BookingStatus.COMPLETED } })
    const successRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0'

    return NextResponse.json({
      currentMetrics: {
        monthlyRevenue: Number(currentStats._sum.amount || 0),
        activeUsers,
        totalBookings: currentStats._count,
        successRate: parseFloat(successRate)
      },
      growth: {
        revenue: parseFloat(revenueGrowth),
        users: parseFloat(userGrowthPercent),
        bookings: parseFloat(bookingGrowth),
        successRate: 2.1 // Mock improvement
      },
      chartData: {
        monthlyRevenue: formattedRevenueData,
        userGrowth: formattedUserGrowth,
        categoryData: formattedCategoryData,
        topTalents: formattedTopTalents
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
