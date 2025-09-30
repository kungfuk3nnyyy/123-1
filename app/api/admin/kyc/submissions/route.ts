
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build filter conditions
    const whereCondition: any = {}
    if (status && status !== 'ALL') {
      whereCondition.status = status as VerificationStatus
    }

    const submissions = await prisma.kycSubmission.findMany({
      where: whereCondition,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        KycDocument: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            filePath: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      skip,
    })

    const totalSubmissions = await prisma.kycSubmission.count({
      where: whereCondition,
    })

    const formattedSubmissions = submissions.map((submission: any) => ({
      id: submission.id,
      userId: submission.userId,
      userName: submission.User.name || 'Unnamed User',
      userEmail: submission.User.email,
      userRole: submission.User.role,
      userJoinDate: submission.User.createdAt.toISOString(),
      status: submission.status,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() || null,
      rejectionReason: submission.rejectionReason,
      adminNotes: submission.adminNotes,
      documents: submission.KycDocument.map((doc: any) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
      })),
    }))

    return NextResponse.json({
      success: true,
      data: {
        submissions: formattedSubmissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSubmissions / limit),
          totalItems: totalSubmissions,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching KYC submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KYC submissions' },
      { status: 500 }
    )
  }
}
