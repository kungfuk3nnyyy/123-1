
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus, NotificationType } from '@prisma/client'
import { NotificationTriggers } from '@/lib/notification-service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, rejectionReason, adminNotes } = await request.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const status = action === 'approve' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED

    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a submission' },
        { status: 400 }
      )
    }

    // Find the KYC submission with user data
    const kycSubmission = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        KycDocument: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
          },
        },
      },
    })

    if (!kycSubmission) {
      return NextResponse.json(
        { error: 'KYC submission not found' },
        { status: 404 }
      )
    }

    if (kycSubmission.status !== VerificationStatus.PENDING) {
      return NextResponse.json(
        { error: 'This submission has already been reviewed' },
        { status: 400 }
      )
    }

    // Update the KYC submission
    const updatedSubmission = await prisma.kycSubmission.update({
      where: { id: params.id },
      data: {
        status: status,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? rejectionReason?.trim() : null,
        adminNotes: adminNotes?.trim() || null,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        KycDocument: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
          },
        },
      },
    })

    // Update the user's verification status
    await prisma.user.update({
      where: { id: kycSubmission.userId },
      data: { verificationStatus: status },
    })

    // Create admin audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        adminEmail: session.user.email || '',
        targetUserId: kycSubmission.userId,
        targetUserEmail: kycSubmission.User.email,
        action: `KYC_${action.toUpperCase()}`,
        details: `KYC submission ${action}d for user ${kycSubmission.User.name || kycSubmission.User.email}. Documents: ${kycSubmission.KycDocument.length}. ${action === 'reject' ? `Reason: ${rejectionReason}` : ''}${adminNotes ? ` Notes: ${adminNotes}` : ''}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    // Send notification to user about KYC status update
    try {
      if (action === 'approve') {
        await NotificationTriggers.onKycApproved(params.id)
      } else {
        await NotificationTriggers.onKycRejected(params.id, rejectionReason, adminNotes)
      }
    } catch (notificationError) {
      console.error('Failed to send user notification:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `KYC submission ${action}d successfully`,
      data: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        reviewedAt: updatedSubmission.reviewedAt,
        rejectionReason: updatedSubmission.rejectionReason,
        adminNotes: updatedSubmission.adminNotes,
        user: updatedSubmission.User,
        documentsCount: updatedSubmission.KycDocument.length,
      },
    })
  } catch (error) {
    console.error('Error reviewing KYC submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to review KYC submission' },
      { status: 500 }
    )
  }
}
