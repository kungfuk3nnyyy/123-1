
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendRealTimeMessage } from '@/lib/real-time-messaging'

export const dynamic = 'force-dynamic'

// PATCH /api/messages/[id]/read - Mark message as read
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // First get the message to find the sender
    const messageToUpdate = await prisma.message.findFirst({
      where: {
        id,
        receiverId: session.user.id
      },
      select: {
        id: true,
        senderId: true,
        isRead: true
      }
    })

    if (!messageToUpdate) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 })
    }

    // Only update if not already read
    if (!messageToUpdate.isRead) {
      await prisma.message.update({
        where: { id },
        data: { isRead: true }
      })

      // Send real-time notification to sender that message was read
      sendRealTimeMessage(messageToUpdate.senderId, {
        type: 'message_read',
        data: {
          messageId: id,
          readBy: session.user.id,
          readAt: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Message marked as read' })
  } catch (error) {
    console.error('Mark message read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
