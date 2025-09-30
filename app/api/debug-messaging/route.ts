
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    console.log('🔍 Debug Messaging System - Starting analysis...')

    // 1. Check database connectivity and basic counts
    const basicStats = {
      totalUsers: await prisma.user.count(),
      totalBookings: await prisma.booking.count(),
      totalMessages: await prisma.message.count(),
      totalNotifications: await prisma.notification.count()
    }

    console.log('📊 Basic Stats:', basicStats)

    // 2. Get test users for messaging analysis
    const testUsers = await prisma.user.findMany({
      where: {
        email: { in: ['john@doe.com', 'sarah.photographer@example.com', 'contact@eventpro.ke'] }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    console.log('👥 Test Users Found:', testUsers)

    // 3. Analyze messaging patterns
    const messagingAnalysis = {
      messagesByUser: await Promise.all(testUsers.map(async (user: any) => {
        const sentCount = await prisma.message.count({ where: { senderId: user.id } })
        const receivedCount = await prisma.message.count({ where: { receiverId: user.id } })
        return {
          user: `${user.role}: ${user.email}`,
          sent: sentCount,
          received: receivedCount,
          total: sentCount + receivedCount
        }
      }))
    }

    console.log('💬 Message Analysis:', messagingAnalysis)

    // 4. Get recent messages with sender/receiver details
    const recentMessages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        User_Message_senderIdToUser: { 
          select: { 
            id: true, 
            email: true, 
            name: true, 
            role: true 
          } 
        },
        User_Message_receiverIdToUser: { 
          select: { 
            id: true, 
            email: true, 
            name: true, 
            role: true 
          } 
        },
        Booking: { 
          select: { 
            id: true, 
            status: true, 
            Event: { 
              select: { 
                title: true 
              } 
            } 
          } 
        }
      }
    })

    const formattedMessages = recentMessages.map((m: any) => ({
      id: m.id,
      content: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : ''),
      from: `${m.User_Message_senderIdToUser.role}: ${m.User_Message_senderIdToUser.email}`,
      to: `${m.User_Message_receiverIdToUser.role}: ${m.User_Message_receiverIdToUser.email}`,
      booking: m.Booking?.Event?.title || 'No event',
      isRead: m.isRead,
      createdAt: m.createdAt
    }))

    console.log('📨 Recent Messages:', formattedMessages)

    // 5. Get booking-message relationships
    const bookingMessageStats = await prisma.booking.findMany({
      where: {
        Message: {
          some: {}
        }
      },
      take: 3,
      include: {
        User_Booking_organizerIdToUser: { select: { id: true, email: true, name: true } },
        User_Booking_talentIdToUser: { select: { id: true, email: true, name: true } },
        Event: { select: { title: true, eventDate: true } },
        Message: { select: { id: true, content: true } }
      }
    })

    const bookingWithMessages = bookingMessageStats.map((b: any) => ({
      id: b.id,
      status: b.status,
      eventTitle: b.Event.title,
      organizer: b.User_Booking_organizerIdToUser.email,
      talent: b.User_Booking_talentIdToUser.email,
      messageCount: b.Message.length
    }))

    console.log('🔗 Bookings with Messages:', bookingWithMessages)

    // 6. Check for orphaned messages (messages without valid booking relationships)
    const orphanedMessages = await prisma.message.count({
      where: {
        bookingId: {
          not: {
            in: (await prisma.booking.findMany({ select: { id: true } })).map(b => b.id)
          }
        }
      }
    })

    const debugSummary = {
      timestamp: new Date().toISOString(),
      basicStats,
      testUsers: testUsers.length,
      messagingAnalysis,
      recentMessages: {
        count: formattedMessages.length,
        messages: formattedMessages
      },
      bookingMessageRelationships: {
        bookingsWithMessages: bookingWithMessages.length,
        details: bookingWithMessages
      },
      orphanedMessages,
      systemHealth: {
        dbConnected: true,
        userSetupComplete: testUsers.length >= 2,
        messagesExist: basicStats.totalMessages > 0,
        bookingMessageLinks: bookingWithMessages.length > 0
      }
    }

    console.log('🏥 System Health Check:', debugSummary.systemHealth)
    console.log('✅ Debug analysis complete!')

    return NextResponse.json({
      success: true,
      data: debugSummary
    })

  } catch (error) {
    console.error('❌ Debug messaging error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
