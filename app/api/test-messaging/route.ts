
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendRealTimeMessage, getActiveConnections } from '@/lib/real-time-messaging'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const testResults = {
      timestamp: new Date().toISOString(),
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      } : null,
      tests: [] as any[]
    }
    
    // Test 1: Database Connection and Message Count
    try {
      const messageCount = await prisma.message.count()
      const bookingCount = await prisma.booking.count()
      const userCount = await prisma.user.count()
      
      testResults.tests.push({
        name: 'Database Connection',
        status: 'PASS',
        details: {
          messageCount,
          bookingCount,
          userCount
        }
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Database Connection',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 2: Message API Endpoint (if user is logged in)
    if (session?.user) {
      try {
        const endpoint = session.user.role === 'ORGANIZER' ? '/api/organizer/messages' : 
                        session.user.role === 'TALENT' ? '/api/talent/messages' : '/api/messages'
        
        // Test the appropriate endpoint by calling the logic directly
        let messages: any = []
        if (session.user.role === 'ORGANIZER') {
          messages = await prisma.message.groupBy({
            by: ['senderId', 'receiverId'],
            where: {
              OR: [
                { senderId: session.user.id },
                { receiverId: session.user.id }
              ]
            },
            _count: { id: true }
          })
        } else if (session.user.role === 'TALENT') {
          messages = await prisma.message.findMany({
            where: {
              OR: [
                { senderId: session.user.id },
                { receiverId: session.user.id }
              ]
            },
            take: 10
          })
        }
        
        testResults.tests.push({
          name: 'Messages API Logic',
          status: 'PASS',
          details: {
            endpoint,
            messageCount: messages?.length || 0,
            userRole: session.user.role
          }
        })
      } catch (error) {
        testResults.tests.push({
          name: 'Messages API Logic',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Test 3: Real-time Messaging System
    try {
      const activeConnections = getActiveConnections()
      
      testResults.tests.push({
        name: 'Real-time Messaging',
        status: 'PASS',
        details: {
          activeConnections,
          hasRealTimeFunction: typeof sendRealTimeMessage === 'function'
        }
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Real-time Messaging',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test 4: Sample Data Check
    try {
      const sampleBooking = await prisma.booking.findFirst({
        include: {
          User_Booking_organizerIdToUser: { select: { id: true, email: true, role: true } },
          User_Booking_talentIdToUser: { select: { id: true, email: true, role: true } },
          Event: { select: { title: true } }
        }
      })
      
      const sampleMessages = await prisma.message.findMany({
        take: 3,
        include: {
          User_Message_senderIdToUser: { select: { email: true, role: true } },
          User_Message_receiverIdToUser: { select: { email: true, role: true } }
        }
      })
      
      testResults.tests.push({
        name: 'Sample Data Check',
        status: 'PASS',
        details: {
          hasBooking: !!sampleBooking,
          bookingDetails: sampleBooking ? {
            id: sampleBooking.id,
            eventTitle: sampleBooking.Event?.title,
            organizerEmail: sampleBooking.User_Booking_organizerIdToUser?.email,
            talentEmail: sampleBooking.User_Booking_talentIdToUser?.email
          } : null,
          messageCount: sampleMessages.length,
          sampleMessages: sampleMessages.map(m => ({
            from: m.User_Message_senderIdToUser?.email,
            to: m.User_Message_receiverIdToUser?.email,
            content: m.content.substring(0, 50) + '...'
          }))
        }
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Sample Data Check',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    return NextResponse.json({
      success: true,
      testResults
    })
    
  } catch (error) {
    console.error('Test messaging error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to test sending messages
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { action, receiverId, content, bookingId } = await request.json()
    
    if (action === 'send_test_message') {
      // Get a sample booking
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [
            { organizerId: session.user.id },
            { talentId: session.user.id }
          ]
        }
      })
      
      if (!booking) {
        return NextResponse.json({ error: 'No booking found for testing' }, { status: 400 })
      }
      
      // Determine receiver
      const testReceiverId = booking.organizerId === session.user.id 
        ? booking.talentId 
        : booking.organizerId
      
      // Create test message
      const testMessage = await prisma.message.create({
        data: {
          bookingId: booking.id,
          senderId: session.user.id,
          receiverId: testReceiverId,
          content: content || `Test message from ${session.user.role} at ${new Date().toISOString()}`
        },
        include: {
          User_Message_senderIdToUser: { select: { id: true, name: true, role: true } },
          User_Message_receiverIdToUser: { select: { id: true, name: true, role: true } },
          Booking: { select: { id: true } }
        }
      })
      
      // Send real-time notification
      const realTimeResult = sendRealTimeMessage(testReceiverId, {
        type: 'new_message',
        data: {
          id: testMessage.id,
          content: testMessage.content,
          createdAt: testMessage.createdAt,
          sender: testMessage.User_Message_senderIdToUser,
          booking: testMessage.Booking,
          isRead: false
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Test message sent',
        testMessage: {
          id: testMessage.id,
          content: testMessage.content,
          from: testMessage.User_Message_senderIdToUser?.role,
          to: testMessage.User_Message_receiverIdToUser?.role,
          realTimeSent: realTimeResult
        }
      })
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    
  } catch (error) {
    console.error('Test messaging POST error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
