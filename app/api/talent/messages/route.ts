


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { sendRealTimeMessage } from '@/lib/real-time-messaging'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    // If no bookingId provided, return all conversations for this talent
    if (!bookingId) {
      const bookings = await prisma.booking.findMany({
        where: { talentId: session.user.id },
        include: {
          User_Booking_organizerIdToUser: {
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

      // Build conversation objects
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
          organizer: b.User_Booking_organizerIdToUser,
          lastMessage: b.Message[0] || null,
          unreadCount
        }
      }))

      return NextResponse.json({ success: true, data: conversations })
    }

    // Verify talent has access to this booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        talentId: session.user.id
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
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
            email: true
          }
        },
        User_Message_receiverIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        File: true
      },
      orderBy: {
        createdAt: 'asc'
      }
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

    // Mark messages as read for this talent
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

    return NextResponse.json({
      success: true,
      data: messages
    })

  } catch (error) {
    console.error('Talent messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, content } = await request.json()

    if (!bookingId || !content?.trim()) {
      return NextResponse.json({ error: 'Booking ID and message content required' }, { status: 400 })
    }

    // Verify talent has access to this booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        talentId: session.user.id
      },
      include: {
        User_Booking_organizerIdToUser: true,
        Event: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        bookingId: bookingId,
        senderId: session.user.id,
        receiverId: booking.organizerId,
        content: content.trim(),
        isRead: false
      },
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        User_Message_receiverIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        Booking: {
          include: {
            Event: true
          }
        }
      }
    })

    // Send real-time message
    sendRealTimeMessage(booking.organizerId, {
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

    return NextResponse.json({
      success: true,
      data: message
    })

  } catch (error) {
    console.error('Send talent message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
