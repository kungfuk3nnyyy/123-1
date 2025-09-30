
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { markNotificationAsRead } from '@/lib/notification-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PUT /api/notifications/[id] - Mark specific notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const notificationId = params.id
    
    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const success = await markNotificationAsRead(notificationId)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to mark notification as read' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
