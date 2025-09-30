

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus, PayoutStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // Get talent profile
    const talent = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        TalentProfile: {
          include: {
            BankAccount: true
          }
        }
      }
    })

    if (!talent?.TalentProfile) {
      return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })
    }

    // Get upcoming bookings
    const upcomingBookings = await prisma.booking.count({
      where: {
        talentId: userId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS]
        }
      }
    })

    // Calculate total earnings (completed bookings)
    const completedBookings = await prisma.booking.findMany({
      where: {
        talentId: userId,
        status: BookingStatus.COMPLETED
      },
      select: {
        talentAmount: true,
        updatedAt: true
      }
    })

    const totalEarnings = completedBookings.reduce((sum: number, booking: any) => sum + Number(booking.talentAmount), 0)
    
    // Calculate monthly earnings (current month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyEarnings = completedBookings
      .filter((booking: any) => booking.updatedAt >= startOfMonth)
      .reduce((sum: number, booking: any) => sum + Number(booking.talentAmount), 0)

    // Get pending payouts
    const pendingPayouts = await prisma.payout.aggregate({
      where: {
        talentId: userId,
        status: PayoutStatus.PENDING
      },
      _sum: {
        amount: true
      }
    })

    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    })

    // Get unread notifications count
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        upcomingBookings,
        totalEarnings,
        pendingPayouts: Number(pendingPayouts._sum.amount || 0),
        averageRating: talent.TalentProfile.averageRating,
        totalReviews: talent.TalentProfile.totalReviews,
        profileCompletion: calculateProfileCompletion(talent.TalentProfile),
        unreadMessages,
        unreadNotifications,
        monthlyEarnings
      }
    })

  } catch (error) {
    console.error('Talent dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateProfileCompletion(profile: any): number {
  const fields = [
    profile.bio,
    profile.tagline,
    profile.location,
    profile.phoneNumber,
    profile.category,
    profile.skills?.length > 0,
    profile.experience,
    profile.hourlyRate,
    profile.availability
  ]
  
  const completed = fields.filter((field: any) => 
    field !== null && field !== undefined && field !== '' && field !== false
  ).length
  
  return Math.round((completed / fields.length) * 100)
}
