
import { prisma } from '@/lib/db'
import { VerificationStatus, DocumentType, NotificationType } from '@prisma/client'
import { 
  saveUploadedFile, 
  deleteUploadedFile,
  validateFile,
  KYC_UPLOAD_CONFIG,
  FileUploadError,
  UploadedFile
} from '@/lib/upload'
import { createNotification } from '@/lib/notification-service'
import path from 'path'

export interface KycSubmissionParams {
  userId: string
  documentType: 'national_id' | 'business_registration'
  files: { [key: string]: File }
}

export interface KycSubmissionResult {
  success: boolean
  message: string
  data?: {
    submissionId: string
    status: VerificationStatus
    documentsCount: number
    documents: Array<{
      id: string
      documentType: DocumentType
      fileName: string
      fileSize: number
      mimeType: string
    }>
  }
  error?: string
}

export interface KycReviewParams {
  submissionId: string
  adminId: string
  status: 'approved' | 'rejected'
  adminNotes?: string
  rejectionReason?: string
}

export interface KycReviewResult {
  success: boolean
  message: string
  data?: {
    submissionId: string
    status: VerificationStatus
    reviewedAt: Date
  }
  error?: string
}

/**
 * Enhanced KYC Service with secure file upload and comprehensive document management
 */
export class KycService {

  /**
   * Submit KYC documents with enhanced security and validation
   */
  static async submitKycDocuments(params: KycSubmissionParams): Promise<KycSubmissionResult> {
    const { userId, documentType, files } = params

    try {
      // Check if user already has a pending or verified KYC submission
      const existingKyc = await prisma.kycSubmission.findFirst({
        where: {
          userId: userId,
          status: { in: [VerificationStatus.PENDING, VerificationStatus.VERIFIED] }
        }
      })

      if (existingKyc) {
        return {
          success: false,
          message: 'You already have a pending or approved KYC submission'
        }
      }

      // Validate document type and required files
      const validation = this.validateDocumentSubmission(documentType, files)
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Invalid document submission'
        }
      }

      // Process submission in database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create KYC submission record
        const kycSubmission = await tx.kycSubmission.create({
          data: {
            userId: userId,
            status: VerificationStatus.PENDING,
            submittedAt: new Date(),
          },
        })

        // Process and save each file
        const savedDocuments = []
        const uploadErrors: string[] = []
        
        for (const [fileKey, file] of Object.entries(files)) {
          if (!file) continue

          try {
            // Determine document type from file key
            const docType = this.getDocumentTypeFromFileKey(fileKey, documentType)
            
            // Generate secure file prefix
            const filePrefix = `kyc_${userId}_${kycSubmission.id}_${docType}_`
            
            // Enhanced file validation
            await this.validateKycFile(file, docType)
            
            // Save file with enhanced security
            const uploadedFile = await saveUploadedFile(file, KYC_UPLOAD_CONFIG, filePrefix)

            // Create document record with metadata
            const document = await tx.kycDocument.create({
              data: {
                submissionId: kycSubmission.id,
                documentType: docType,
                fileName: uploadedFile.fileName,
                filePath: uploadedFile.filePath,
                fileUrl: uploadedFile.fileUrl,
                fileSize: uploadedFile.fileSize,
                mimeType: uploadedFile.mimeType,
              },
            })

            savedDocuments.push(document)
          } catch (error) {
            const errorMessage = error instanceof FileUploadError 
              ? `${fileKey}: ${error.message}` 
              : `${fileKey}: Failed to upload file`
            uploadErrors.push(errorMessage)
          }
        }

        // If there were upload errors, rollback and return error
        if (uploadErrors.length > 0) {
          // Clean up any uploaded files
          for (const doc of savedDocuments) {
            await deleteUploadedFile(doc.filePath).catch(() => {})
          }
          throw new Error(`File upload failed: ${uploadErrors.join(', ')}`)
        }

        // Update user verification status if it was unverified
        const currentUser = await tx.user.findUnique({
          where: { id: userId },
          select: { verificationStatus: true }
        })

        if (currentUser?.verificationStatus === VerificationStatus.UNVERIFIED) {
          await tx.user.update({
            where: { id: userId },
            data: { verificationStatus: VerificationStatus.PENDING }
          })
        }

        // Create audit log entry
        await this.createKycAuditLog(tx, userId, kycSubmission.id, 'KYC_SUBMITTED', {
          documentType,
          documentsCount: savedDocuments.length,
          fileNames: savedDocuments.map(doc => doc.fileName)
        })

        return {
          submission: kycSubmission,
          documents: savedDocuments
        }
      })

      // Send notifications to admins
      await this.notifyAdminsOfNewSubmission(result.submission.id, userId)

      return {
        success: true,
        message: 'KYC documents submitted successfully. They will be reviewed by our team within 1-2 business days.',
        data: {
          submissionId: result.submission.id,
          status: result.submission.status,
          documentsCount: result.documents.length,
          documents: result.documents.map(doc => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || 'application/octet-stream'
          }))
        }
      }

    } catch (error) {
      console.error('Error submitting KYC:', error)
      return {
        success: false,
        message: 'Failed to submit KYC documents. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Review KYC submission by admin
   */
  static async reviewKycSubmission(params: KycReviewParams): Promise<KycReviewResult> {
    const { submissionId, adminId, status, adminNotes, rejectionReason } = params

    try {
      // Validate review parameters
      if (status === 'rejected' && !rejectionReason?.trim()) {
        return {
          success: false,
          message: 'Rejection reason is required when rejecting KYC submission'
        }
      }

      // Get submission with user data
      const submission = await prisma.kycSubmission.findUnique({
        where: { id: submissionId },
        include: {
          User: true,
          KycDocument: true
        }
      })

      if (!submission) {
        return {
          success: false,
          message: 'KYC submission not found'
        }
      }

      if (submission.status !== VerificationStatus.PENDING) {
        return {
          success: false,
          message: 'KYC submission has already been reviewed'
        }
      }

      // Process review in database transaction
      const result = await prisma.$transaction(async (tx) => {
        const newStatus = status === 'approved' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED
        const reviewedAt = new Date()

        // Update KYC submission
        const updatedSubmission = await tx.kycSubmission.update({
          where: { id: submissionId },
          data: {
            status: newStatus,
            reviewedById: adminId,
            reviewedAt: reviewedAt,
            adminNotes: adminNotes?.trim() || null,
            rejectionReason: status === 'rejected' ? rejectionReason?.trim() : null
          }
        })

        // Update user verification status
        await tx.user.update({
          where: { id: submission.userId },
          data: { verificationStatus: newStatus }
        })

        // Create audit log entry
        await this.createKycAuditLog(tx, adminId, submissionId, 'KYC_REVIEWED', {
          reviewStatus: status,
          userId: submission.userId,
          userEmail: submission.User.email,
          adminNotes: adminNotes,
          rejectionReason: rejectionReason,
          documentsCount: submission.KycDocument.length
        })

        return updatedSubmission
      })

      // Send notification to user
      await this.notifyUserOfReviewResult(submission.userId, status, adminNotes, rejectionReason)

      return {
        success: true,
        message: `KYC submission ${status} successfully`,
        data: {
          submissionId: result.id,
          status: result.status,
          reviewedAt: result.reviewedAt!
        }
      }

    } catch (error) {
      console.error('Error reviewing KYC submission:', error)
      return {
        success: false,
        message: 'Failed to review KYC submission',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get KYC submission details with documents
   */
  static async getKycSubmission(submissionId: string, includeFileUrls: boolean = false) {
    return await prisma.kycSubmission.findUnique({
      where: { id: submissionId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verificationStatus: true
          }
        },
        KycDocument: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            filePath: includeFileUrls,
            fileUrl: includeFileUrls,
            fileSize: true,
            mimeType: true,
            createdAt: true
          }
        }
      }
    })
  }

  /**
   * Get KYC statistics for admin dashboard
   */
  static async getKycStatistics(dateRange?: { start: Date; end: Date }) {
    const whereClause = dateRange ? {
      submittedAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    } : {}

    const stats = await prisma.kycSubmission.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      }
    })

    const totalSubmissions = stats.reduce((sum, stat) => sum + stat._count.id, 0)

    return {
      totalSubmissions,
      statusBreakdown: stats.map(stat => ({
        status: stat.status,
        count: stat._count.id
      })),
      pendingCount: stats.find(s => s.status === VerificationStatus.PENDING)?._count.id || 0,
      verifiedCount: stats.find(s => s.status === VerificationStatus.VERIFIED)?._count.id || 0,
      rejectedCount: stats.find(s => s.status === VerificationStatus.REJECTED)?._count.id || 0
    }
  }

  /**
   * Validate document submission
   */
  private static validateDocumentSubmission(
    documentType: string, 
    files: { [key: string]: File }
  ): { valid: boolean; error?: string } {
    if (!['national_id', 'business_registration'].includes(documentType)) {
      return { valid: false, error: 'Invalid document type' }
    }

    if (documentType === 'national_id') {
      if (!files.idFront || !files.idBack) {
        return { valid: false, error: 'Both front and back of ID are required for national ID verification' }
      }
    } else if (documentType === 'business_registration') {
      if (!files.businessCert) {
        return { valid: false, error: 'Business certificate is required for business registration verification' }
      }
    }

    return { valid: true }
  }

  /**
   * Enhanced file validation for KYC documents
   */
  private static async validateKycFile(file: File, docType: DocumentType): Promise<void> {
    // Basic file validation
    await validateFile(file, KYC_UPLOAD_CONFIG)

    // Additional KYC-specific validations
    if (file.size < 10 * 1024) { // 10KB minimum
      throw new FileUploadError('File is too small. Please ensure the document is clearly visible.', 'FILE_TOO_SMALL')
    }

    // Validate file extension matches MIME type
    const allowedExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    }

    const expectedExtensions = allowedExtensions[file.type as keyof typeof allowedExtensions]
    if (expectedExtensions) {
      const fileExtension = path.extname(file.name).toLowerCase()
      if (!expectedExtensions.includes(fileExtension)) {
        throw new FileUploadError(
          `File extension ${fileExtension} does not match MIME type ${file.type}`,
          'EXTENSION_MISMATCH'
        )
      }
    }
  }

  /**
   * Get document type from file key
   */
  private static getDocumentTypeFromFileKey(fileKey: string, documentType: string): DocumentType {
    const keyMappings: { [key: string]: DocumentType } = {
      'idFront': DocumentType.ID_FRONT,
      'idBack': DocumentType.ID_BACK,
      'businessCert': DocumentType.BUSINESS_CERT
    }

    return keyMappings[fileKey] || DocumentType.ID_FRONT
  }

  /**
   * Create KYC audit log entry
   */
  private static async createKycAuditLog(
    tx: any,
    userId: string,
    submissionId: string,
    action: string,
    details: any
  ) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    await tx.adminAuditLog.create({
      data: {
        adminId: userId,
        adminEmail: user?.email || 'system',
        targetUserId: details.userId || userId,
        targetUserEmail: details.userEmail || user?.email || 'unknown',
        action: action,
        details: JSON.stringify({
          submissionId: submissionId,
          ...details
        }),
        ipAddress: null,
        userAgent: null
      }
    })
  }

  /**
   * Notify admins of new KYC submission
   */
  private static async notifyAdminsOfNewSubmission(submissionId: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, role: true }
      })

      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          isActive: true 
        },
        select: { id: true }
      })

      const notifications = admins.map(admin => 
        createNotification({
          userId: admin.id,
          type: NotificationType.ADMIN_USER_REGISTRATION,
          title: 'New KYC Submission',
          message: `${user?.name || 'User'} (${user?.email}) has submitted KYC documents for review.`,
          actionUrl: `/admin/kyc/${submissionId}`
        })
      )

      await Promise.allSettled(notifications)
    } catch (error) {
      console.error('Failed to notify admins of new KYC submission:', error)
    }
  }

  /**
   * Notify user of KYC review result
   */
  private static async notifyUserOfReviewResult(
    userId: string, 
    status: string, 
    adminNotes?: string, 
    rejectionReason?: string
  ) {
    try {
      const title = status === 'approved' ? 'KYC Verification Approved' : 'KYC Verification Rejected'
      let message = status === 'approved' 
        ? 'Your KYC documents have been approved. You can now access all platform features.'
        : 'Your KYC documents have been rejected. Please review the feedback and resubmit.'

      if (rejectionReason) {
        message += ` Reason: ${rejectionReason}`
      }

      if (adminNotes) {
        message += ` Admin notes: ${adminNotes}`
      }

      await createNotification({
        userId: userId,
        type: NotificationType.ADMIN_USER_REGISTRATION,
        title: title,
        message: message,
        actionUrl: '/profile/verification'
      })
    } catch (error) {
      console.error('Failed to notify user of KYC review result:', error)
    }
  }

  /**
   * Clean up rejected KYC documents (optional security measure)
   */
  static async cleanupRejectedDocuments(submissionId: string, retentionDays: number = 30) {
    try {
      const submission = await prisma.kycSubmission.findUnique({
        where: { id: submissionId },
        include: { KycDocument: true }
      })

      if (!submission || submission.status !== VerificationStatus.REJECTED) {
        return
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      if (submission.reviewedAt && submission.reviewedAt < cutoffDate) {
        // Delete physical files
        for (const doc of submission.KycDocument) {
          await deleteUploadedFile(doc.filePath)
        }

        // Update database records to mark files as deleted
        await prisma.kycDocument.updateMany({
          where: { submissionId: submissionId },
          data: { 
            filePath: 'DELETED',
            fileUrl: null 
          }
        })
      }
    } catch (error) {
      console.error('Error cleaning up rejected KYC documents:', error)
    }
  }
}
