
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getUserNotificationPreferences, updateNotificationPreferences } from '@/lib/notification-service'

export const dynamic = 'force-dynamic'

// GET /api/notifications/preferences - Get user notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preferences = await getUserNotificationPreferences(session.user.id)
    
    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
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
    
    // Validate the request body
    const allowedFields = [
      'emailMessages',
      'emailBookings', 
      'emailPayments',
      'emailReviews',
      'emailReminders',
      'emailPayouts',
      'emailAdminUpdates'
    ]

    const updates: any = {}
    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid preferences provided' },
        { status: 400 }
      )
    }

    const preferences = await updateNotificationPreferences(session.user.id, updates)
    
    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
