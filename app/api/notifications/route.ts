
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/notification-service'

export const dynamic = 'force-dynamic'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const result = await getUserNotifications(session.user.id, {
      limit,
      offset,
      unreadOnly
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications - Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    if (body.action === 'markAllAsRead') {
      const success = await markAllNotificationsAsRead(session.user.id)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read'
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to mark notifications as read' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
