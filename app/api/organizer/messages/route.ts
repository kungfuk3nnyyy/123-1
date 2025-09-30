

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, NotificationType } from '@prisma/client'
import { sendRealTimeMessage } from '@/lib/real-time-messaging'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    // If no bookingId provided, return summary of all conversations for this organizer
    if (!bookingId) {
      const bookings = await prisma.booking.findMany({
        where: { organizerId: session.user.id },
        include: {
          User_Booking_talentIdToUser: {
            select: { id: true, name: true, email: true }
          },
          Message: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              User_Message_senderIdToUser: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })

      const conversations = await Promise.all(bookings.map(async (b) => {
        const unreadCount = await prisma.message.count({
          where: {
            bookingId: b.id,
            receiverId: session.user.id,
            isRead: false
          }
        })
        return {
          bookingId: b.id,
          talent: b.User_Booking_talentIdToUser,
          lastMessage: b.Message[0] || null,
          unreadCount
        }
      }))

      return NextResponse.json({ success: true, data: { conversations } })
    }

    // Verify organizer has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        organizerId: session.user.id
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 })
    }

    // Get messages for this booking
    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        User_Message_senderIdToUser: {
          include: {
            TalentProfile: true,
            OrganizerProfile: true
          }
        },
        User_Message_receiverIdToUser: {
          include: {
            TalentProfile: true,
            OrganizerProfile: true
          }
        },
        Booking: {
          include: {
            Event: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get conversation metadata
    const otherUserId = booking.talentId
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      include: {
        TalentProfile: true,
        OrganizerProfile: true
      }
    })

    // Get messages that will be marked as read
    const messagesToMarkRead = await prisma.message.findMany({
      where: {
        bookingId,
        receiverId: session.user.id,
        isRead: false
      },
      select: {
        id: true,
        senderId: true
      }
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        bookingId,
        receiverId: session.user.id,
        isRead: false
      },
      data: { isRead: true }
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

    return NextResponse.json({
      success: true,
      data: {
        messages,
        conversation: {
          bookingId,
          otherUser,
          booking
        }
      }
    })

  } catch (error) {
    console.error('Error fetching organizer messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, content } = await request.json()

    if (!bookingId || !content) {
      return NextResponse.json(
        { error: 'Booking ID and content are required' },
        { status: 400 }
      )
    }

    // Verify organizer has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        organizerId: session.user.id
      },
      include: {
        Event: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    const receiverId = booking.talentId

    // Create message
    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId: session.user.id,
        receiverId,
        content,
        isRead: false
      },
      include: {
        User_Message_senderIdToUser: {
          include: {
            OrganizerProfile: true
          }
        },
        User_Message_receiverIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Booking: {
          select: {
            id: true,
            Event: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        message: `You have a new message from ${session.user.name}`,
        messageId: message.id,
        bookingId: bookingId,
        actionUrl: `/talent/messages?bookingId=${bookingId}`
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
          id: message.Booking?.id,
          eventTitle: message.Booking?.Event?.title
        }
      }
    })

    // Format response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        id: message.User_Message_senderIdToUser.id,
        name: message.User_Message_senderIdToUser.name,
        role: message.User_Message_senderIdToUser.role
      },
      booking: message.Booking,
      isRead: false
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: formattedMessage
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
