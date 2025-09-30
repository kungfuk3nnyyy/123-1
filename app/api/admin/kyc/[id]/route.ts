
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { KycService } from '@/lib/services/kycService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/kyc/[id]
 * Get KYC submission details for admin review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      )
    }

    const submission = await KycService.getKycSubmission(params.id, true)

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'KYC submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: submission
    })

  } catch (error) {
    console.error('Error fetching KYC submission:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/kyc/[id]
 * Review KYC submission (approve or reject)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      )
    }

    const { status, adminNotes, rejectionReason } = await request.json()

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status (approved/rejected) is required' },
        { status: 400 }
      )
    }

    // Use the enhanced KYC service for review
    const result = await KycService.reviewKycSubmission({
      submissionId: params.id,
      adminId: session.user.id,
      status,
      adminNotes,
      rejectionReason
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data
    })

  } catch (error) {
    console.error('Error reviewing KYC submission:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
