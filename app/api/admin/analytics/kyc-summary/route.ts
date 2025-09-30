

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface KycStatusCount {
  status: VerificationStatus
  _count: number
}

interface KycSubmissionData {
  id: string
  userId: string
  documentType: string
  status: VerificationStatus
  submittedAt: Date
  reviewedAt: Date | null
  User: {
    id: string
    name: string | null
    email: string
    role: UserRole
  }
}

interface CompletedSubmissionData {
  submittedAt: Date
  reviewedAt: Date | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get KYC submission counts by status
    const kycStatusCounts = await prisma.kycSubmission.groupBy({
      by: ['status'],
      _count: true
    })

    // Get recent KYC submissions (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentSubmissions = await prisma.kycSubmission.findMany({
      where: {
        submittedAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 10
    })

    // Get overdue submissions (pending for more than 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const overdueSubmissions = await prisma.kycSubmission.findMany({
      where: {
        status: VerificationStatus.PENDING,
        submittedAt: {
          lt: threeDaysAgo
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        submittedAt: 'asc'
      }
    })

    // Calculate average processing time for completed submissions
    const completedSubmissions = await prisma.kycSubmission.findMany({
      where: {
        status: {
          in: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]
        },
        reviewedAt: {
          not: null
        }
      },
      select: {
        submittedAt: true,
        reviewedAt: true
      }
    })

    const averageProcessingTime = completedSubmissions.length > 0 ?
      completedSubmissions.reduce((sum: number, submission: CompletedSubmissionData) => {
        const processingTime = submission.reviewedAt!.getTime() - submission.submittedAt.getTime()
        return sum + processingTime
      }, 0) / completedSubmissions.length / (1000 * 60 * 60 * 24) : 0 // Convert to days

    // Format status counts
    const statusSummary = {
      pending: kycStatusCounts.find((s: KycStatusCount) => s.status === VerificationStatus.PENDING)?._count || 0,
      verified: kycStatusCounts.find((s: KycStatusCount) => s.status === VerificationStatus.VERIFIED)?._count || 0,
      rejected: kycStatusCounts.find((s: KycStatusCount) => s.status === VerificationStatus.REJECTED)?._count || 0,
      unverified: kycStatusCounts.find((s: KycStatusCount) => s.status === VerificationStatus.UNVERIFIED)?._count || 0
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        statusSummary,
        recentSubmissions: recentSubmissions.map((submission: KycSubmissionData) => ({
          id: submission.id,
          userId: submission.userId,
          userName: submission.User.name,
          userEmail: submission.User.email,
          userRole: submission.User.role,
          documentType: submission.documentType,
          status: submission.status,
          submittedAt: submission.submittedAt,
          reviewedAt: submission.reviewedAt,
          isOverdue: submission.submittedAt < threeDaysAgo && submission.status === VerificationStatus.PENDING
        })),
        overdueSubmissions: overdueSubmissions.map((submission: KycSubmissionData) => ({
          id: submission.id,
          userId: submission.userId,
          userName: submission.User.name,
          userEmail: submission.User.email,
          userRole: submission.User.role,
          documentType: submission.documentType,
          submittedAt: submission.submittedAt,
          daysOverdue: Math.floor((Date.now() - submission.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
        })),
        metrics: {
          totalSubmissions: kycStatusCounts.reduce((sum: number, s: KycStatusCount) => sum + s._count, 0),
          pendingCount: statusSummary.pending,
          overdueCount: overdueSubmissions.length,
          averageProcessingDays: Math.round(averageProcessingTime * 10) / 10, // Round to 1 decimal
          recentSubmissionCount: recentSubmissions.length
        }
      }
    })

  } catch (error) {
    console.error('KYC analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
