
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { getAdminReferralStats } from '@/lib/referral-service'

export const dynamic = 'force-dynamic'

// GET /api/admin/referrals - Get referral statistics for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const stats = await getAdminReferralStats()
    
    return NextResponse.json({ 
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching admin referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral statistics' }, 
      { status: 500 }
    )
  }
}
