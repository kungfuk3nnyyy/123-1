

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'
import { getUnreadNotificationCount } from '@/lib/notification-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get active events
    const activeEvents = await prisma.event.count({
      where: {
        organizerId: userId,
        isActive: true,
        eventDate: {
          gte: new Date()
        }
      }
    })

    // Get total bookings
    const totalBookings = await prisma.booking.count({
      where: {
        organizerId: userId
      }
    })

    // Calculate total spent (completed bookings)
    const completedBookings = await prisma.booking.findMany({
      where: {
        organizerId: userId,
        status: BookingStatus.COMPLETED
      },
      select: {
        amount: true,
        updatedAt: true
      }
    })

    const totalSpent = completedBookings.reduce((sum, booking) => sum + Number(booking.amount), 0)

    // Get pending bookings
    const pendingBookings = await prisma.booking.count({
      where: {
        organizerId: userId,
        status: BookingStatus.PENDING
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
    const unreadNotifications = await getUnreadNotificationCount(userId)

    // Calculate events this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const eventsThisMonth = await prisma.event.count({
      where: {
        organizerId: userId,
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Get completed events
    const completedEvents = await prisma.event.count({
      where: {
        organizerId: userId,
        eventDate: {
          lt: new Date()
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        activeEvents,
        totalBookings,
        totalSpent,
        pendingBookings,
        unreadMessages,
        unreadNotifications,
        eventsThisMonth,
        completedEvents
      }
    })

  } catch (error) {
    console.error('Organizer dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
