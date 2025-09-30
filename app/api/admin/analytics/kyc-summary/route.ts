

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus, KycSubmission, DocumentType } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface KycStatusCount {
  status: VerificationStatus
  _count: {
    _all: number
  }
}

interface KycSubmissionWithUser extends KycSubmission {
  User: {
    id: string
    name: string | null
    email: string
    role: UserRole
  }
  KycDocument: Array<{
    documentType: DocumentType
  }>
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
      _count: {
        _all: true
      }
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
        },
        KycDocument: {
          take: 1, // Just get the first document for the type
          select: {
            documentType: true
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
        },
        KycDocument: {
          take: 1,
          select: {
            documentType: true
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

    // Format status counts with proper type safety
    const getStatusCount = (status: VerificationStatus): number => {
      const count = kycStatusCounts.find(s => s.status === status)?._count?._all;
      return typeof count === 'number' ? count : 0;
    };

    const statusSummary = {
      pending: getStatusCount(VerificationStatus.PENDING),
      verified: getStatusCount(VerificationStatus.VERIFIED),
      rejected: getStatusCount(VerificationStatus.REJECTED),
      unverified: getStatusCount(VerificationStatus.UNVERIFIED)
    };
    return NextResponse.json({ 
      success: true, 
      data: {
        statusSummary,
        recentSubmissions: recentSubmissions.map((submission: KycSubmissionWithUser) => ({
          id: submission.id,
          userId: submission.userId,
          userName: submission.User?.name || null,
          userEmail: submission.User?.email || '',
          userRole: submission.User?.role || UserRole.TALENT,
          documentType: submission.KycDocument[0]?.documentType || DocumentType.ID_FRONT,
          status: submission.status,
          submittedAt: submission.submittedAt,
          reviewedAt: submission.reviewedAt,
          isOverdue: submission.status === VerificationStatus.PENDING && 
                    submission.submittedAt < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        })),
        overdueSubmissions: overdueSubmissions.map((submission: KycSubmissionWithUser) => ({
          id: submission.id,
          userId: submission.userId,
          userName: submission.User?.name || null,
          userEmail: submission.User?.email || '',
          documentType: submission.KycDocument[0]?.documentType || DocumentType.ID_FRONT,
          submittedAt: submission.submittedAt,
          daysOverdue: Math.floor((Date.now() - submission.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
        })),
        metrics: {
          totalSubmissions: kycStatusCounts.reduce((sum, s) => sum + (s._count?._all || 0), 0),
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
