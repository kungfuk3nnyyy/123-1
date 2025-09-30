
const { KycService } = require('../lib/services/kycService')
const { prisma } = require('../lib/db')

// Mock file data
const mockFile = {
  name: 'test-id.jpg',
  type: 'image/jpeg',
  size: 1024 * 1024, // 1MB
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  slice: jest.fn().mockReturnValue({
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
  })
}

const mockUser = {
  id: 'user-123',
  email: 'user@test.com',
  name: 'Test User',
  verificationStatus: 'UNVERIFIED'
}

describe('KYC Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should submit KYC documents successfully', async () => {
    // Mock database operations
    prisma.kycSubmission.findFirst = jest.fn().mockResolvedValue(null) // No existing submission
    prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return await callback({
        kycSubmission: {
          create: jest.fn().mockResolvedValue({
            id: 'kyc-123',
            status: 'PENDING',
            submittedAt: new Date()
          })
        },
        kycDocument: {
          create: jest.fn().mockResolvedValue({
            id: 'doc-123',
            documentType: 'ID_FRONT',
            fileName: 'test-file.jpg',
            fileSize: 1024 * 1024,
            mimeType: 'image/jpeg'
          })
        },
        user: {
          findUnique: jest.fn().mockResolvedValue(mockUser),
          update: jest.fn().mockResolvedValue({ ...mockUser, verificationStatus: 'PENDING' })
        },
        adminAuditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-123' })
        }
      })
    })

    // Mock file upload
    jest.mock('../lib/upload', () => ({
      saveUploadedFile: jest.fn().mockResolvedValue({
        fileName: 'test-file.jpg',
        filePath: '/uploads/kyc/test-file.jpg',
        fileUrl: '/uploads/kyc/test-file.jpg',
        fileSize: 1024 * 1024,
        mimeType: 'image/jpeg'
      }),
      validateFile: jest.fn().mockResolvedValue(undefined)
    }))

    const result = await KycService.submitKycDocuments({
      userId: 'user-123',
      documentType: 'national_id',
      files: {
        idFront: mockFile,
        idBack: mockFile
      }
    })

    expect(result.success).toBe(true)
    expect(result.data.status).toBe('PENDING')
    expect(result.data.documentsCount).toBe(2)
  })

  test('should reject duplicate KYC submission', async () => {
    prisma.kycSubmission.findFirst = jest.fn().mockResolvedValue({
      id: 'existing-kyc',
      status: 'PENDING'
    })

    const result = await KycService.submitKycDocuments({
      userId: 'user-123',
      documentType: 'national_id',
      files: {
        idFront: mockFile,
        idBack: mockFile
      }
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('already have a pending or approved KYC submission')
  })

  test('should validate document type and required files', async () => {
    const result = await KycService.submitKycDocuments({
      userId: 'user-123',
      documentType: 'national_id',
      files: {
        idFront: mockFile
        // Missing idBack
      }
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Both front and back of ID are required')
  })

  test('should review KYC submission successfully', async () => {
    const mockSubmission = {
      id: 'kyc-123',
      userId: 'user-123',
      status: 'PENDING',
      User: mockUser,
      KycDocument: [
        { id: 'doc-123', documentType: 'ID_FRONT' }
      ]
    }

    prisma.kycSubmission.findUnique = jest.fn().mockResolvedValue(mockSubmission)
    prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return await callback({
        kycSubmission: {
          update: jest.fn().mockResolvedValue({
            id: 'kyc-123',
            status: 'VERIFIED',
            reviewedAt: new Date()
          })
        },
        user: {
          update: jest.fn().mockResolvedValue({ ...mockUser, verificationStatus: 'VERIFIED' }),
          findUnique: jest.fn().mockResolvedValue({ email: 'admin@test.com' })
        },
        adminAuditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-123' })
        }
      })
    })

    const result = await KycService.reviewKycSubmission({
      submissionId: 'kyc-123',
      adminId: 'admin-123',
      status: 'approved',
      adminNotes: 'Documents look good'
    })

    expect(result.success).toBe(true)
    expect(result.data.status).toBe('VERIFIED')
  })

  test('should require rejection reason when rejecting', async () => {
    const result = await KycService.reviewKycSubmission({
      submissionId: 'kyc-123',
      adminId: 'admin-123',
      status: 'rejected'
      // Missing rejectionReason
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Rejection reason is required')
  })

  test('should get KYC statistics', async () => {
    prisma.kycSubmission.groupBy = jest.fn().mockResolvedValue([
      { status: 'PENDING', _count: { id: 5 } },
      { status: 'VERIFIED', _count: { id: 10 } },
      { status: 'REJECTED', _count: { id: 2 } }
    ])

    const stats = await KycService.getKycStatistics()

    expect(stats.totalSubmissions).toBe(17)
    expect(stats.pendingCount).toBe(5)
    expect(stats.verifiedCount).toBe(10)
    expect(stats.rejectedCount).toBe(2)
  })
})

console.log('KYC Service tests defined')
