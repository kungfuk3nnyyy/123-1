
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { VerificationStatus, NotificationType, DocumentType } from '@prisma/client'
import { 
  extractFilesFromFormData, 
  KYC_UPLOAD_CONFIG,
  FileUploadError 
} from '@/lib/upload'
import { KycService } from '@/lib/services/kycService'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const documentType = formData.get('documentType') as string

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      )
    }

    // Define expected files based on document type
    let expectedFiles: { key: string; required: boolean }[] = []
    
    if (documentType === 'national_id') {
      expectedFiles = [
        { key: 'idFront', required: true },
        { key: 'idBack', required: true }
      ]
    } else if (documentType === 'business_registration') {
      expectedFiles = [
        { key: 'businessCert', required: true }
      ]
    } else {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "national_id" or "business_registration"' },
        { status: 400 }
      )
    }

    // Extract files from form data
    const files = await extractFilesFromFormData(formData, expectedFiles)

    // Filter out null files and create files object for service
    const validFiles: { [key: string]: File } = {}
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        validFiles[key] = file
      }
    }

    // Use the enhanced KYC service
    const result = await KycService.submitKycDocuments({
      userId: session.user.id,
      documentType: documentType as 'national_id' | 'business_registration',
      files: validFiles
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
    console.error('Error submitting KYC:', error)
    
    // Handle specific error types
    if (error instanceof FileUploadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to submit KYC documents. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's KYC status and latest submission with documents
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verificationStatus: true,
        KycSubmission: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            rejectionReason: true,
            adminNotes: true,
            KycDocument: {
              select: {
                id: true,
                documentType: true,
                fileName: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const latestSubmission = user.KycSubmission[0]

    return NextResponse.json({
      success: true,
      data: {
        verificationStatus: user.verificationStatus,
        latestSubmission: latestSubmission ? {
          id: latestSubmission.id,
          status: latestSubmission.status,
          submittedAt: latestSubmission.submittedAt,
          reviewedAt: latestSubmission.reviewedAt,
          rejectionReason: latestSubmission.rejectionReason,
          adminNotes: latestSubmission.adminNotes,
          documents: latestSubmission.KycDocument.map(doc => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
          })),
        } : null
      }
    })
  } catch (error) {
    console.error('Error fetching KYC status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}
