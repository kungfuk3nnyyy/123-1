
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserReferralStats, ensureUserHasReferralCode } from '@/lib/referral-service'

export const dynamic = 'force-dynamic'

// GET /api/referrals - Get current user's referral statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user has a referral code (for existing users)
    if (session?.user?.name) {
      await ensureUserHasReferralCode(session.user.id)
    }

    const stats = await getUserReferralStats(session.user.id)
    
    return NextResponse.json({ 
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral statistics' }, 
      { status: 500 }
    )
  }
}
