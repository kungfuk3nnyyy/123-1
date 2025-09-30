

import { prisma } from '@/lib/db'
import { ReferralStatus, ReferralRewardStatus, UserRole } from '@prisma/client'

// Referral configuration
const REFERRAL_CONFIG = {
  REFERRER_REWARD_AMOUNT: 1000, // KES 1,000 for successful referrer
  REFERRED_REWARD_AMOUNT: 500,  // KES 500 for referred user
  MINIMUM_CONVERSION_AMOUNT: 5000, // Minimum booking amount to qualify
  REWARD_EXPIRY_DAYS: 30 // Referral expires after 30 days
}

// Generate unique referral code
export async function generateReferralCode(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Create a code from user's name/email and random string
    const namePrefix = user.name?.substring(0, 3)?.toUpperCase() || user.email.substring(0, 3).toUpperCase()
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    let code = `${namePrefix}${randomSuffix}`
    
    // Ensure uniqueness
    let codeExists = await prisma.referral.findFirst({
      where: { referralCode: code }
    })
    
    while (codeExists) {
      const newRandomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
      code = `${namePrefix}${newRandomSuffix}`
      codeExists = await prisma.referral.findFirst({
        where: { referralCode: code }
      })
    }
    
    return code
    
  } catch (error) {
    console.error('Error generating referral code:', error)
    throw new Error('Failed to generate referral code')
  }
}

// Create referral relationship
export async function createReferral(referrerId: string, referredEmail: string, referralCode: string): Promise<boolean> {
  try {
    // Check if referred user exists
    const referredUser = await prisma.user.findUnique({
      where: { email: referredEmail }
    })
    
    if (!referredUser) {
      console.log('Referred user not found, referral will be created when they sign up')
      return false
    }
    
    // Check if referral already exists
    const existingReferral = await prisma.referral.findUnique({
      where: {
        referrerId_referredId: {
          referrerId: referrerId,
          referredId: referredUser.id
        }
      }
    })
    
    if (existingReferral) {
      console.log('Referral relationship already exists')
      return false
    }
    
    // Create referral
    await prisma.referral.create({
      data: {
        referrerId: referrerId,
        referredId: referredUser.id,
        referralCode: referralCode,
        status: ReferralStatus.PENDING,
        rewardStatus: ReferralRewardStatus.PENDING
      }
    })
    
    console.log(`Referral created: ${referrerId} -> ${referredUser.id}`)
    return true
    
  } catch (error) {
    console.error('Error creating referral:', error)
    return false
  }
}

// Check for conversion events and process referrer rewards
export async function checkAndProcessConversion(userId: string, conversionType: 'booking_payment' | 'talent_payout', bookingId?: string): Promise<void> {
  try {
    // Find pending referral where this user is the referred user
    const referral = await prisma.referral.findFirst({
      where: {
        referredId: userId,
        status: ReferralStatus.PENDING,
        rewardStatus: ReferralRewardStatus.PENDING
      },
      include: {
        User_Referral_referrerIdToUser: true,
        User_Referral_referredIdToUser: true
      }
    })
    
    if (!referral) {
      return // No pending referral found
    }
    
    // Check if conversion qualifies based on type and amount
    if (conversionType === 'booking_payment' && bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { amount: true, organizerId: true, talentId: true }
      })
      
      if (!booking || parseFloat(booking.amount.toString()) < REFERRAL_CONFIG.MINIMUM_CONVERSION_AMOUNT) {
        console.log('Booking does not qualify for referral conversion')
        return
      }
      
      // Only convert if the referred user was involved in this booking
      if (booking.organizerId !== userId && booking.talentId !== userId) {
        console.log('User not involved in this booking, no conversion')
        return
      }
    }
    
    // Process referral conversion
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: ReferralStatus.CONVERTED,
        convertedAt: new Date(),
        conversionType: conversionType,
        conversionBookingId: bookingId,
        referrerReward: REFERRAL_CONFIG.REFERRER_REWARD_AMOUNT,
        referredReward: REFERRAL_CONFIG.REFERRED_REWARD_AMOUNT,
        rewardStatus: ReferralRewardStatus.PENDING // Will be processed separately
      }
    })
    
    console.log(`Referral converted: ${referral.id} - Type: ${conversionType}`)
    
    // TODO: Process actual reward payments here
    // This would integrate with your payment system to credit the rewards
    
  } catch (error) {
    console.error('Error processing referral conversion:', error)
  }
}

// Get user's referral statistics
export async function getUserReferralStats(userId: string): Promise<{
  referralCode: string | null
  totalReferrals: number
  successfulReferrals: number
  pendingRewards: number
  totalRewardsEarned: number
  recentReferrals: Array<{
    id: string
    name: string
    email: string
    joinedAt: Date
  }>
}> {
  try {
    // Get user's referral code (generate if doesn't exist)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true }
    })
    
    let referralCode = user?.referralCode
    if (!referralCode) {
      referralCode = await generateReferralCode(userId)
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: referralCode }
      })
    }
    
    // Get referral statistics
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        User_Referral_referredIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    })
    
    const totalReferrals = referrals.length
    const successfulReferrals = referrals.filter((r: any) => r.status === ReferralStatus.CONVERTED).length
    const pendingRewards = referrals
      .filter((r: any) => r.rewardStatus === ReferralRewardStatus.PENDING && r.referrerReward)
      .reduce((sum: number, r: any) => sum + parseFloat(r.referrerReward.toString()), 0)
    const totalRewardsEarned = referrals
      .filter((r: any) => r.rewardStatus === ReferralRewardStatus.CREDITED && r.referrerReward)
      .reduce((sum: number, r: any) => sum + parseFloat(r.referrerReward.toString()), 0)
    
    const recentReferrals = referrals
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((referral: any) => ({
        id: referral.User_Referral_referredIdToUser.id,
        name: referral.User_Referral_referredIdToUser.name,
        email: referral.User_Referral_referredIdToUser.email,
        joinedAt: referral.User_Referral_referredIdToUser.createdAt
      }))
    
    return {
      referralCode,
      totalReferrals,
      successfulReferrals,
      pendingRewards,
      totalRewardsEarned,
      recentReferrals
    }
    
  } catch (error) {
    console.error('Error getting referral stats:', error)
    return {
      referralCode: null,
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingRewards: 0,
      totalRewardsEarned: 0,
      recentReferrals: []
    }
  }
}

// Get all referrals for admin dashboard
export async function getAllReferrals(page: number = 1, limit: number = 50): Promise<{
  referrals: Array<{
    id: string
    referralCode: string
    status: ReferralStatus
    rewardStatus: ReferralRewardStatus
    referrerReward: number | null
    referredReward: number | null
    convertedAt: Date | null
    conversionType: string | null
    createdAt: Date
    referrer: any
    referred: any
  }>
  total: number
  page: number
  totalPages: number
}> {
  try {
    const skip = (page - 1) * limit
    
    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User_Referral_referrerIdToUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          User_Referral_referredIdToUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.referral.count()
    ])
    
    const formattedReferrals = referrals.map((referral: any) => ({
      id: referral.id,
      referralCode: referral.referralCode,
      status: referral.status,
      rewardStatus: referral.rewardStatus,
      referrerReward: referral.referrerReward ? parseFloat(referral.referrerReward.toString()) : null,
      referredReward: referral.referredReward ? parseFloat(referral.referredReward.toString()) : null,
      convertedAt: referral.convertedAt,
      conversionType: referral.conversionType,
      createdAt: referral.createdAt,
      referrer: referral.User_Referral_referrerIdToUser,
      referred: referral.User_Referral_referredIdToUser,
    }))
    
    return {
      referrals: formattedReferrals,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
    
  } catch (error) {
    console.error('Error getting all referrals:', error)
    return {
      referrals: [],
      total: 0,
      page: 1,
      totalPages: 0
    }
  }
}

// Process pending rewards (called by a background job)
export async function processPendingRewards(): Promise<void> {
  try {
    const pendingReferrals = await prisma.referral.findMany({
      where: {
        rewardStatus: ReferralRewardStatus.PENDING,
        status: ReferralStatus.CONVERTED,
        referrerReward: { not: null }
      },
      include: {
        User_Referral_referrerIdToUser: { select: { id: true, email: true, name: true } },
        User_Referral_referredIdToUser: { select: { id: true, email: true, name: true } }
      }
    })
    
    for (const referral of pendingReferrals) {
      try {
        // TODO: Implement actual reward processing logic here
        // This would integrate with your payment system
        
        console.log(`Processing reward for referral ${referral.id}`)
        console.log(`Referrer: ${referral.User_Referral_referrerIdToUser.email} - Reward: KES ${referral.referrerReward}`)
        console.log(`Referred: ${referral.User_Referral_referredIdToUser.email} - Reward: KES ${referral.referredReward}`)
        
        // For now, just mark as credited (in production, only do this after successful payment)
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            rewardStatus: ReferralRewardStatus.CREDITED,
            rewardCreditedAt: new Date()
          }
        })
        
      } catch (error) {
        console.error(`Error processing reward for referral ${referral.id}:`, error)
        
        // Mark as failed
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            rewardStatus: ReferralRewardStatus.FAILED,
            rewardFailureReason: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }
    
  } catch (error) {
    console.error('Error processing pending rewards:', error)
  }
}

// Cleanup expired referrals (called by a background job)
export async function cleanupExpiredReferrals(): Promise<void> {
  try {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() - REFERRAL_CONFIG.REWARD_EXPIRY_DAYS)
    
    const expiredReferrals = await prisma.referral.updateMany({
      where: {
        status: ReferralStatus.PENDING,
        createdAt: { lt: expiryDate }
      },
      data: {
        status: ReferralStatus.PENDING // Keep as PENDING since EXPIRED doesn't exist
      }
    })
    
    console.log(`Expired ${expiredReferrals.count} referrals`)
    
  } catch (error) {
    console.error('Error cleaning up expired referrals:', error)
  }
}

// Process referral for new user signup
export async function processReferral(userEmail: string, referralCode?: string): Promise<void> {
  if (!referralCode) return
  
  try {
    // Find the referrer by referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode }
    })
    
    if (!referrer) {
      console.log(`Invalid referral code: ${referralCode}`)
      return
    }
    
    // Find the newly created user
    const newUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })
    
    if (!newUser) {
      console.log(`User not found: ${userEmail}`)
      return
    }
    
    // Create the referral relationship
    await createReferral(referrer.id, userEmail, referralCode)
    
  } catch (error) {
    console.error('Error processing referral:', error)
  }
}

// Ensure user has referral code
export async function ensureUserHasReferralCode(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true }
    })
    
    if (user?.referralCode) {
      return user.referralCode
    }
    
    // Generate new referral code
    const newCode = await generateReferralCode(userId)
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: newCode }
    })
    
    return newCode
    
  } catch (error) {
    console.error('Error ensuring referral code:', error)
    throw error
  }
}

// Get admin referral statistics
export async function getAdminReferralStats(): Promise<{
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalRewardsEarned: number
  pendingRewards: number
  topReferrers: Array<{
    userId: string
    userName: string
    userEmail: string
    referralCount: number
    successfulReferrals: number
    totalRewards: number
  }>
}> {
  try {
    const [totalReferrals, successfulReferrals, pendingReferrals] = await Promise.all([
      prisma.referral.count(),
      prisma.referral.count({ where: { status: ReferralStatus.CONVERTED } }),
      prisma.referral.count({ where: { status: ReferralStatus.PENDING } })
    ])
    
    const rewardStats = await prisma.referral.aggregate({
      where: { referrerReward: { not: null } },
      _sum: { referrerReward: true }
    })
    
    const pendingRewardStats = await prisma.referral.aggregate({
      where: { 
        referrerReward: { not: null },
        rewardStatus: ReferralRewardStatus.PENDING 
      },
      _sum: { referrerReward: true }
    })
    
    // Get top referrers
    const topReferrers = await prisma.referral.groupBy({
      by: ['referrerId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })
    
    const topReferrersWithDetails = await Promise.all(
      topReferrers.map(async (referrer: any) => {
        const user = await prisma.user.findUnique({
          where: { id: referrer.referrerId },
          select: { name: true, email: true }
        })
        
        const successful = await prisma.referral.count({
          where: { 
            referrerId: referrer.referrerId,
            status: ReferralStatus.CONVERTED 
          }
        })
        
        const rewards = await prisma.referral.aggregate({
          where: { 
            referrerId: referrer.referrerId,
            referrerReward: { not: null },
            rewardStatus: ReferralRewardStatus.CREDITED
          },
          _sum: { referrerReward: true }
        })
        
        return {
          userId: referrer.referrerId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'Unknown',
          referralCount: referrer._count.id,
          successfulReferrals: successful,
          totalRewards: parseFloat(rewards._sum.referrerReward?.toString() || '0')
        }
      })
    )
    
    return {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      totalRewardsEarned: parseFloat(rewardStats._sum.referrerReward?.toString() || '0'),
      pendingRewards: parseFloat(pendingRewardStats._sum.referrerReward?.toString() || '0'),
      topReferrers: topReferrersWithDetails
    }
    
  } catch (error) {
    console.error('Error getting admin referral stats:', error)
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      totalRewardsEarned: 0,
      pendingRewards: 0,
      topReferrers: []
    }
  }
}
