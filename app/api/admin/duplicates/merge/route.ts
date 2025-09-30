
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { previewAccountMerge, mergeAccounts } from '@/lib/account-merge'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { primaryUserId, mergedUserId, reason, preview = false } = body

    if (!primaryUserId || !mergedUserId) {
      return NextResponse.json(
        { error: 'Primary user ID and merged user ID are required' },
        { status: 400 }
      )
    }

    if (primaryUserId === mergedUserId) {
      return NextResponse.json(
        { error: 'Cannot merge a user with itself' },
        { status: 400 }
      )
    }

    // Generate merge preview
    const mergePreview = await previewAccountMerge(primaryUserId, mergedUserId)

    if (preview) {
      return NextResponse.json({ preview: mergePreview })
    }

    // Perform the actual merge
    await mergeAccounts({
      primaryUserId,
      mergedUserId,
      mergeReason: reason || 'Admin-initiated merge',
      mergedByAdminId: session.user.id,
      mergeType: 'ADMIN_INITIATED'
    })

    return NextResponse.json({
      success: true,
      message: 'Accounts merged successfully',
      mergedData: mergePreview.dataToMerge
    })

  } catch (error) {
    console.error('Error in merge API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
