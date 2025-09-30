import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { sendRealTimeMessage } from '@/lib/real-time-messaging'

export const dynamic = 'force-dynamic'

// Create or get a direct message conversation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('otherUserId')

    // If no otherUserId provided, return list of conversations for the current user
    if (!otherUserId) {
      // Get all unique users the current user has messaged with
      const sentMessages = await prisma.directMessage.findMany({
        where: { senderId: session.user.id },
        select: { receiverId: true },
        distinct: ['receiverId']
      })

      const receivedMessages = await prisma.directMessage.findMany({
        where: { receiverId: session.user.id },
        select: { senderId: true },
        distinct: ['senderId']
      })

      const userIds = [
        ...new Set([
          ...sentMessages.map(m => m.receiverId),
          ...receivedMessages.map(m => m.senderId)
        ])
      ]

      // Get user details and latest message for each conversation
      const conversations = await Promise.all(
        userIds.map(async (userId) => {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              TalentProfile: {
                select: { category: true, location: true }
              },
              OrganizerProfile: {
                select: { companyName: true }
              }
            }
          })

          const lastMessage = await prisma.directMessage.findFirst({
            where: {
              OR: [
                { senderId: session.user.id, receiverId: userId },
                { senderId: userId, receiverId: session.user.id }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          })

          const unreadCount = await prisma.directMessage.count({
            where: {
              senderId: userId,
              receiverId: session.user.id,
              isRead: false
            }
          })

          return {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              category: user.TalentProfile?.category,
              companyName: user.OrganizerProfile?.companyName,
              location: user.TalentProfile?.location
            },
            lastMessage,
            unreadCount
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: { conversations: conversations.filter(c => c.user) }
      })
    }

    // Get messages between current user and other user
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, image: true, role: true }
        }
      }
    })

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false
      },
      data: { isRead: true }
    })

    // Send read receipt
    sendRealTimeMessage(otherUserId, {
      type: 'direct_message_read',
      data: {
        readBy: session.user.id,
        readAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: { messages }
    })

  } catch (error) {
    console.error('Error in direct messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch direct messages' },
      { status: 500 }
    )
  }
}

// Send a direct message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, content } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    // Debug: Log session and receiver info
    console.log('Session user ID:', session.user.id);
    console.log('Receiver ID from request:', receiverId);

    // Verify receiver exists and is not the sender
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver) {
      console.error('Receiver not found with ID:', receiverId);
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    if (receiver.id === session.user.id) {
      console.log('User attempted to send message to themselves');
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      )
    }

    // Verify sender exists in the database
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!sender) {
      console.error('Sender not found with ID:', session.user.id);
      return NextResponse.json(
        { error: 'Your account was not found' },
        { status: 404 }
      );
    }

    // Create the message
    const message = await prisma.directMessage.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId: receiver.id,
        isRead: false
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, image: true, role: true }
        }
      }
    })

    // Send real-time message to receiver
    sendRealTimeMessage(receiver.id, {
      type: 'direct_message',
      data: message
    })

    // Create notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiver.id,
        type: 'MESSAGE_RECEIVED', // Using the correct enum value from the database
        title: 'New Message',
        message: `You have a new message from ${session.user.name || 'a user'}`,
        actionUrl: `/${receiver.role === 'TALENT' ? 'talent' : 'organizer'}/messages?userId=${session.user.id}`,
        emailSent: false
      }
    })

    return NextResponse.json({
      success: true,
      data: { message }
    })

  } catch (error) {
    console.error('Error sending direct message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
