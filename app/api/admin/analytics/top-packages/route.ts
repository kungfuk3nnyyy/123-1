


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface BookingData {
  talentId: string
  amount: any
  User_Booking_talentIdToUser: {
    name: string | null
    TalentProfile: {
      category: string | null
      Package: PackageInfo[]
    } | null
  } | null
}

interface PackageInfo {
  id: string
  title: string
  category: string
  price: any
  coverImageUrl: string | null
  isPublished: boolean
}

interface TalentBookingData {
  talentId: string
  talentName: string
  category: string
  bookingCount: number
  totalRevenue: number
  averageBookingValue: number
  packages: PackageInfo[]
}

interface PreviousBookingData {
  talentId: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '5')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    // Get packages with booking counts in the specified period
    const packageBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        Event: {
          include: {
            // We need to get package info through the event
            // Since bookings are linked to events, not directly to packages
            // We'll need to modify this query or the schema relationship
          }
        },
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: {
              include: {
                Package: {
                  select: {
                    id: true,
                    title: true,
                    category: true,
                    price: true,
                    coverImageUrl: true,
                    isPublished: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Since we don't have direct package-booking relationship,
    // we'll analyze by talent and their packages
    const talentBookingCounts = new Map<string, TalentBookingData>()

    packageBookings.forEach((booking: BookingData) => {
      const talentId = booking.talentId
      const talentName = booking.User_Booking_talentIdToUser?.name || 'Unknown Talent'
      const category = booking.User_Booking_talentIdToUser?.TalentProfile?.category || 'Other'
      const packages = booking.User_Booking_talentIdToUser?.TalentProfile?.Package || []
      
      if (!talentBookingCounts.has(talentId)) {
        talentBookingCounts.set(talentId, {
          talentId,
          talentName,
          category,
          bookingCount: 0,
          totalRevenue: 0,
          averageBookingValue: 0,
          packages
        })
      }
      
      const existing = talentBookingCounts.get(talentId)!
      existing.bookingCount += 1
      existing.totalRevenue += Number(booking.amount)
      existing.averageBookingValue = existing.totalRevenue / existing.bookingCount
    })

    // Convert to array and sort by booking count
    const topTalents = Array.from(talentBookingCounts.values())
      .sort((a: TalentBookingData, b: TalentBookingData) => b.bookingCount - a.bookingCount)
      .slice(0, limit)

    // Get trend data for comparison (previous period)
    const previousStartDate = new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000))
    const previousEndDate = startDate

    const previousBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate
        },
        talentId: {
          in: topTalents.map((t: TalentBookingData) => t.talentId)
        }
      },
      select: {
        talentId: true
      }
    })

    const previousCounts = new Map<string, number>()
    previousBookings.forEach((booking: PreviousBookingData) => {
      const count = previousCounts.get(booking.talentId) || 0
      previousCounts.set(booking.talentId, count + 1)
    })

    // Add trend information
    const topPackagesWithTrend = topTalents.map((talent: TalentBookingData) => {
      const previousCount = previousCounts.get(talent.talentId) || 0
      const trendPercentage = previousCount > 0 ? 
        Math.round(((talent.bookingCount - previousCount) / previousCount) * 100) : 100
      
      return {
        ...talent,
        trend: {
          percentage: trendPercentage,
          direction: trendPercentage >= 0 ? 'up' : 'down',
          previousPeriodCount: previousCount
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        topPackages: topPackagesWithTrend,
        summary: {
          totalAnalyzedBookings: packageBookings.length,
          totalTalentsWithBookings: talentBookingCounts.size,
          period: `${days} days`,
          averageBookingsPerTalent: talentBookingCounts.size > 0 ? 
            Math.round(packageBookings.length / talentBookingCounts.size) : 0
        }
      }
    })

  } catch (error) {
    console.error('Top packages analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
