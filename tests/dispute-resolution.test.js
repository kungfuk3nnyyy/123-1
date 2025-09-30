
const { DisputeResolutionService } = require('../lib/services/disputeService')
const { prisma } = require('../lib/db')

// Mock data for testing
const mockDispute = {
  id: 'dispute-123',
  status: 'OPEN',
  Booking: {
    id: 'booking-123',
    organizerId: 'organizer-123',
    talentId: 'talent-123',
    amount: 1000,
    platformFee: 50,
    talentAmount: 950,
    Event: {
      title: 'Test Event'
    },
    Transaction: [{
      id: 'transaction-123',
      type: 'BOOKING_PAYMENT',
      status: 'COMPLETED',
      paystackRef: 'paystack-ref-123'
    }]
  },
  User: {
    id: 'user-123',
    email: 'user@test.com'
  }
}

describe('Dispute Resolution Service', () => {
  beforeEach(() => {
    // Mock Prisma methods
    jest.clearAllMocks()
  })

  test('should resolve dispute in favor of organizer', async () => {
    // Mock database operations
    prisma.dispute.findUnique = jest.fn().mockResolvedValue(mockDispute)
    prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return await callback({
        dispute: {
          update: jest.fn().mockResolvedValue({ id: 'dispute-123', status: 'RESOLVED_ORGANIZER_FAVOR' })
        },
        booking: {
          update: jest.fn().mockResolvedValue({ id: 'booking-123', status: 'CANCELLED' })
        },
        refund: {
          create: jest.fn().mockResolvedValue({ id: 'refund-123' })
        },
        transaction: {
          create: jest.fn().mockResolvedValue({ id: 'transaction-456' }),
          findFirst: jest.fn().mockResolvedValue(mockDispute.Booking.Transaction[0])
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ email: 'admin@test.com' })
        },
        adminAuditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-123' })
        }
      })
    })

    const result = await DisputeResolutionService.resolveDispute({
      disputeId: 'dispute-123',
      adminId: 'admin-123',
      resolution: 'organizer_favor',
      resolutionNotes: 'Organizer was right'
    })

    expect(result.success).toBe(true)
    expect(result.data.status).toBe('RESOLVED_ORGANIZER_FAVOR')
    expect(result.data.refundAmount).toBe(1000)
    expect(result.data.payoutAmount).toBe(0)
  })

  test('should resolve dispute in favor of talent', async () => {
    prisma.dispute.findUnique = jest.fn().mockResolvedValue(mockDispute)
    prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return await callback({
        dispute: {
          update: jest.fn().mockResolvedValue({ id: 'dispute-123', status: 'RESOLVED_TALENT_FAVOR' })
        },
        booking: {
          update: jest.fn().mockResolvedValue({ id: 'booking-123', status: 'COMPLETED' })
        },
        payout: {
          create: jest.fn().mockResolvedValue({ id: 'payout-123' })
        },
        transaction: {
          create: jest.fn().mockResolvedValue({ id: 'transaction-456' })
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ email: 'admin@test.com' })
        },
        adminAuditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-123' })
        }
      })
    })

    const result = await DisputeResolutionService.resolveDispute({
      disputeId: 'dispute-123',
      adminId: 'admin-123',
      resolution: 'talent_favor',
      resolutionNotes: 'Talent was right'
    })

    expect(result.success).toBe(true)
    expect(result.data.status).toBe('RESOLVED_TALENT_FAVOR')
    expect(result.data.refundAmount).toBe(0)
    expect(result.data.payoutAmount).toBe(950) // 1000 - 5% dispute resolution fee
  })

  test('should handle partial resolution', async () => {
    prisma.dispute.findUnique = jest.fn().mockResolvedValue(mockDispute)
    prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return await callback({
        dispute: {
          update: jest.fn().mockResolvedValue({ id: 'dispute-123', status: 'RESOLVED_PARTIAL' })
        },
        booking: {
          update: jest.fn().mockResolvedValue({ id: 'booking-123', status: 'COMPLETED' })
        },
        refund: {
          create: jest.fn().mockResolvedValue({ id: 'refund-123' })
        },
        payout: {
          create: jest.fn().mockResolvedValue({ id: 'payout-123' })
        },
        transaction: {
          create: jest.fn().mockResolvedValue({ id: 'transaction-456' }),
          findFirst: jest.fn().mockResolvedValue(mockDispute.Booking.Transaction[0])
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ email: 'admin@test.com' })
        },
        adminAuditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-123' })
        }
      })
    })

    const result = await DisputeResolutionService.resolveDispute({
      disputeId: 'dispute-123',
      adminId: 'admin-123',
      resolution: 'partial_resolution',
      resolutionNotes: 'Split decision',
      refundAmount: 400,
      payoutAmount: 600
    })

    expect(result.success).toBe(true)
    expect(result.data.status).toBe('RESOLVED_PARTIAL')
    expect(result.data.refundAmount).toBe(400)
    expect(result.data.payoutAmount).toBe(570) // 600 - 5% dispute resolution fee
  })

  test('should validate resolution parameters', async () => {
    const result = await DisputeResolutionService.resolveDispute({
      disputeId: 'dispute-123',
      adminId: 'admin-123',
      resolution: 'invalid_resolution',
      resolutionNotes: 'Test notes'
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid resolution type')
  })

  test('should reject partial resolution with excessive amounts', async () => {
    prisma.dispute.findUnique = jest.fn().mockResolvedValue(mockDispute)

    const result = await DisputeResolutionService.resolveDispute({
      disputeId: 'dispute-123',
      adminId: 'admin-123',
      resolution: 'partial_resolution',
      resolutionNotes: 'Test notes',
      refundAmount: 600,
      payoutAmount: 500 // Total 1100 > 1000 booking amount
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('cannot exceed booking amount')
  })
})

console.log('Dispute Resolution Service tests defined')
