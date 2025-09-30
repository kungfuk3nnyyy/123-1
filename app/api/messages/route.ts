

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NotificationType } from '@prisma/client'
import { sendRealTimeMessage } from '@/lib/real-time-messaging'
import { withValidation } from '@/lib/security/middleware'
import { userInputSchemas, querySchemas, validateInput } from '@/lib/security/validation'
import { sanitizeUserInput, sanitizeText } from '@/lib/security/sanitization'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Verify user has access to this booking's messages
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { organizerId: session.user.id },
          { talentId: session.user.id }
        ]
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 })
    }

    // Get messages for this booking
    const messages = await prisma.message.findMany({
      where: {
        bookingId: bookingId
      },
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        User_Message_receiverIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        File: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit,
      skip: offset
    })

    // Get messages that will be marked as read
    const messagesToMarkRead = await prisma.message.findMany({
      where: {
        bookingId: bookingId,
        receiverId: session.user.id,
        isRead: false
      },
      select: {
        id: true,
        senderId: true
      }
    })

    // Mark messages as read for the current user
    await prisma.message.updateMany({
      where: {
        bookingId: bookingId,
        receiverId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Send real-time read receipts to senders
    for (const msg of messagesToMarkRead) {
      sendRealTimeMessage(msg.senderId, {
        type: 'message_read',
        data: {
          messageId: msg.id,
          readBy: session.user.id,
          readAt: new Date().toISOString()
        }
      })
    }

    const totalCount = await prisma.message.count({
      where: { bookingId: bookingId }
    })

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: (offset + limit) < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const postHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let messageData;
    try {
      messageData = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 })
    }

    // Validate and sanitize message data
    try {
      messageData = validateInput(userInputSchemas.message, messageData);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sanitize content
    messageData = sanitizeUserInput(messageData);
    const { bookingId, content, recipientId } = messageData

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 })
    }

    // Verify user has access to this booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { organizerId: session.user.id },
          { talentId: session.user.id }
        ]
      },
      include: {
        Event: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 })
    }

    // Determine receiver
    const receiverId = session.user.id === booking.organizerId ? booking.talentId : booking.organizerId

    // Create the message
    const message = await prisma.message.create({
      data: {
        bookingId: bookingId,
        senderId: session.user.id,
        receiverId: receiverId,
        content: content.trim(),
        isRead: false
      },
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        User_Message_receiverIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        message: `You have a new message from ${session.user.name}`,
        bookingId: bookingId,
        messageId: message.id,
        actionUrl: `/messages?bookingId=${bookingId}`,
        isRead: false,
        emailSent: false
      }
    })

    // Send real-time message notification
    sendRealTimeMessage(receiverId, {
      type: 'new_message',
      data: {
        id: message.id,
        bookingId: message.bookingId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: message.User_Message_senderIdToUser,
        booking: {
          id: booking.id,
          eventTitle: booking.Event?.title
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: message
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withValidation(userInputSchemas.message)(postHandler);
