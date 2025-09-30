
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/referrals/validate - Validate a referral code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referralCode } = body

    if (!referralCode?.trim()) {
      return NextResponse.json({
        valid: false,
        error: 'Referral code is required'
      }, { status: 400 })
    }

    // Check if referral code exists
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.trim() },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!referrer) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid referral code'
      })
    }

    if (!referrer.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'Referral code is no longer active'
      })
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        name: referrer.name,
        role: referrer.role
      },
      reward: 500 // KES 500 signup bonus
    })
  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to validate referral code' 
      }, 
      { status: 500 }
    )
  }
}
