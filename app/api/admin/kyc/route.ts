
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'
import { KycService } from '@/lib/services/kycService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/kyc
 * Get all KYC submissions for admin review with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status as VerificationStatus
    }

    // Get KYC submissions with user data
    const submissions = await prisma.kycSubmission.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verificationStatus: true,
            createdAt: true
          }
        },
        KycDocument: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            createdAt: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      skip
    })

    // Get total count for pagination
    const totalSubmissions = await prisma.kycSubmission.count({ where })

    // Get statistics
    const stats = await KycService.getKycStatistics()

    return NextResponse.json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSubmissions / limit),
          totalItems: totalSubmissions,
          itemsPerPage: limit
        },
        statistics: stats
      }
    })

  } catch (error) {
    console.error('Error fetching KYC submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
