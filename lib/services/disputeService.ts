
import { prisma } from '@/lib/db'
import { 
  DisputeStatus, 
  BookingStatus, 
  TransactionType, 
  TransactionStatus,
  PayoutStatus,
  NotificationType 
} from '@prisma/client'
import { createPaystackRefund } from './paystackService'
import { createNotification } from '@/lib/notification-service'
import { DISPUTE_RESOLUTION_FEE_PERCENTAGE } from '@/lib/types'

export interface DisputeResolutionParams {
  disputeId: string
  adminId: string
  resolution: 'organizer_favor' | 'talent_favor' | 'partial_resolution'
  resolutionNotes: string
  refundAmount?: number
  payoutAmount?: number
}

export interface DisputeResolutionResult {
  success: boolean
  message: string
  data?: {
    disputeId: string
    status: DisputeStatus
    refundAmount?: number
    payoutAmount?: number
    refundTransactionId?: string
    payoutTransactionId?: string
    paystackRefundId?: string
  }
  error?: string
}

export interface DisputeFinancialBreakdown {
  originalAmount: number
  platformFee: number
  talentAmount: number
  refundAmount: number
  payoutAmount: number
  disputeResolutionFee: number
  netRefund: number
  netPayout: number
}

/**
 * Comprehensive dispute resolution service with full financial transaction handling
 */
export class DisputeResolutionService {
  
  /**
   * Resolve a dispute with complete financial transaction processing
   */
  static async resolveDispute(params: DisputeResolutionParams): Promise<DisputeResolutionResult> {
    const { disputeId, adminId, resolution, resolutionNotes, refundAmount, payoutAmount } = params

    try {
      // Validate input parameters
      const validation = await this.validateResolutionParams(params)
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Invalid resolution parameters'
        }
      }

      // Get dispute with all related data
      const dispute = await this.getDisputeWithRelations(disputeId)
      if (!dispute) {
        return {
          success: false,
          message: 'Dispute not found'
        }
      }

      if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.UNDER_REVIEW) {
        return {
          success: false,
          message: 'Dispute is already resolved'
        }
      }

      // Calculate financial breakdown
      const financialBreakdown = this.calculateFinancialBreakdown(
        dispute, 
        resolution, 
        refundAmount, 
        payoutAmount
      )

      // Process resolution in database transaction
      const result = await prisma.$transaction(async (tx) => {
        return await this.processDisputeResolution(
          tx,
          dispute,
          adminId,
          resolution,
          resolutionNotes,
          financialBreakdown
        )
      })

      // Send notifications to all parties
      await this.sendResolutionNotifications(dispute, resolution, resolutionNotes)

      return {
        success: true,
        message: 'Dispute resolved successfully',
        data: result
      }

    } catch (error) {
      console.error('Error resolving dispute:', error)
      return {
        success: false,
        message: 'Failed to resolve dispute',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate resolution parameters
   */
  private static async validateResolutionParams(params: DisputeResolutionParams): Promise<{valid: boolean, error?: string}> {
    const { resolution, resolutionNotes, refundAmount, payoutAmount, disputeId } = params

    if (!resolution || !resolutionNotes?.trim()) {
      return { valid: false, error: 'Resolution type and notes are required' }
    }

    const validResolutions = ['organizer_favor', 'talent_favor', 'partial_resolution']
    if (!validResolutions.includes(resolution)) {
      return { valid: false, error: 'Invalid resolution type' }
    }

    // For partial resolution, validate amounts
    if (resolution === 'partial_resolution') {
      if (refundAmount === undefined && payoutAmount === undefined) {
        return { valid: false, error: 'Partial resolution requires refund amount or payout amount' }
      }

      if ((refundAmount && refundAmount < 0) || (payoutAmount && payoutAmount < 0)) {
        return { valid: false, error: 'Amounts cannot be negative' }
      }

      // Get dispute to validate against booking amount
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { Booking: true }
      })

      if (dispute?.Booking) {
        const totalAmount = parseFloat(dispute.Booking.amount.toString())
        const totalRequested = (refundAmount || 0) + (payoutAmount || 0)
        
        if (totalRequested > totalAmount) {
          return { valid: false, error: 'Total refund and payout cannot exceed booking amount' }
        }
      }
    }

    return { valid: true }
  }

  /**
   * Get dispute with all necessary relations
   */
  private static async getDisputeWithRelations(disputeId: string) {
    return await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        Booking: {
          include: {
            Event: true,
            User_Booking_organizerIdToUser: true,
            User_Booking_talentIdToUser: true,
            Transaction: {
              where: {
                type: TransactionType.BOOKING_PAYMENT,
                status: TransactionStatus.COMPLETED
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        User: true
      }
    })
  }

  /**
   * Calculate financial breakdown for dispute resolution
   */
  private static calculateFinancialBreakdown(
    dispute: any,
    resolution: string,
    refundAmount?: number,
    payoutAmount?: number
  ): DisputeFinancialBreakdown {
    const originalAmount = parseFloat(dispute.Booking.amount.toString())
    const platformFee = parseFloat(dispute.Booking.platformFee.toString())
    const talentAmount = parseFloat(dispute.Booking.talentAmount.toString())

    let calculatedRefund = 0
    let calculatedPayout = 0
    let disputeResolutionFee = 0

    switch (resolution) {
      case 'organizer_favor':
        // Full refund to organizer
        calculatedRefund = originalAmount
        calculatedPayout = 0
        break

      case 'talent_favor':
        // Full payout to talent with dispute resolution fee
        calculatedRefund = 0
        disputeResolutionFee = originalAmount * DISPUTE_RESOLUTION_FEE_PERCENTAGE
        calculatedPayout = originalAmount - disputeResolutionFee
        break

      case 'partial_resolution':
        // Custom amounts with dispute resolution fee applied to payout
        calculatedRefund = refundAmount || 0
        const rawPayout = payoutAmount || 0
        disputeResolutionFee = rawPayout * DISPUTE_RESOLUTION_FEE_PERCENTAGE
        calculatedPayout = rawPayout - disputeResolutionFee
        break
    }

    return {
      originalAmount,
      platformFee,
      talentAmount,
      refundAmount: calculatedRefund,
      payoutAmount: calculatedPayout,
      disputeResolutionFee,
      netRefund: calculatedRefund,
      netPayout: calculatedPayout
    }
  }

  /**
   * Process dispute resolution with all financial transactions
   */
  private static async processDisputeResolution(
    tx: any,
    dispute: any,
    adminId: string,
    resolution: string,
    resolutionNotes: string,
    financialBreakdown: DisputeFinancialBreakdown
  ) {
    const { refundAmount, payoutAmount } = financialBreakdown
    let newDisputeStatus: DisputeStatus
    let newBookingStatus: BookingStatus
    let refundTransactionId: string | undefined
    let payoutTransactionId: string | undefined
    let paystackRefundId: string | undefined

    // Determine new statuses
    switch (resolution) {
      case 'organizer_favor':
        newDisputeStatus = DisputeStatus.RESOLVED_ORGANIZER_FAVOR
        newBookingStatus = BookingStatus.CANCELLED
        break
      case 'talent_favor':
        newDisputeStatus = DisputeStatus.RESOLVED_TALENT_FAVOR
        newBookingStatus = BookingStatus.COMPLETED
        break
      case 'partial_resolution':
        newDisputeStatus = DisputeStatus.RESOLVED_PARTIAL
        newBookingStatus = BookingStatus.COMPLETED
        break
      default:
        throw new Error('Invalid resolution type')
    }

    // Update dispute
    const updatedDispute = await tx.dispute.update({
      where: { id: dispute.id },
      data: {
        status: newDisputeStatus,
        resolvedById: adminId,
        resolutionNotes: resolutionNotes.trim(),
        refundAmount: refundAmount,
        payoutAmount: payoutAmount,
        resolvedAt: new Date()
      }
    })

    // Update booking status
    await tx.booking.update({
      where: { id: dispute.Booking.id },
      data: { 
        status: newBookingStatus,
        completedDate: newBookingStatus === BookingStatus.COMPLETED ? new Date() : null
      }
    })

    // Process refund if needed
    if (refundAmount > 0) {
      const refundResult = await this.processRefund(
        tx,
        dispute,
        refundAmount,
        resolutionNotes,
        adminId
      )
      refundTransactionId = refundResult.transactionId
      paystackRefundId = refundResult.paystackRefundId
    }

    // Process payout if needed
    if (payoutAmount > 0) {
      const payoutResult = await this.processPayout(
        tx,
        dispute,
        payoutAmount,
        resolutionNotes,
        adminId
      )
      payoutTransactionId = payoutResult.transactionId
    }

    // Create audit log entry
    await this.createAuditLogEntry(
      tx,
      adminId,
      dispute,
      resolution,
      resolutionNotes,
      financialBreakdown
    )

    return {
      disputeId: dispute.id,
      status: newDisputeStatus,
      refundAmount,
      payoutAmount,
      refundTransactionId,
      payoutTransactionId,
      paystackRefundId
    }
  }

  /**
   * Process refund with Paystack integration
   */
  private static async processRefund(
    tx: any,
    dispute: any,
    refundAmount: number,
    resolutionNotes: string,
    adminId: string
  ) {
    // Find original payment transaction
    const originalTransaction = dispute.Booking.Transaction.find((t: any) => 
      t.type === TransactionType.BOOKING_PAYMENT && 
      t.status === TransactionStatus.COMPLETED &&
      t.paystackRef
    )

    if (!originalTransaction?.paystackRef) {
      throw new Error('Original payment transaction not found - cannot process refund')
    }

    // Create Paystack refund
    const refundResult = await createPaystackRefund({
      transactionReference: originalTransaction.paystackRef,
      amount: refundAmount,
      reason: `Dispute resolution: ${resolutionNotes.slice(0, 100)}`,
      adminNote: `Admin ${adminId} resolved dispute ${dispute.id}`
    })

    if (!refundResult.success) {
      throw new Error(`Paystack refund failed: ${refundResult.message}`)
    }

    // Create refund record
    await tx.refund.create({
      data: {
        amount: refundAmount,
        bookingId: dispute.Booking.id,
        disputeId: dispute.id,
        paystackRefundId: refundResult.paystackRefundId,
        status: 'PROCESSING',
        reason: `Dispute resolution: ${resolutionNotes.slice(0, 100)}`,
        processedByAdminId: adminId
      }
    })

    // Create refund transaction record
    const refundTransaction = await tx.transaction.create({
      data: {
        bookingId: dispute.Booking.id,
        userId: dispute.Booking.organizerId,
        type: TransactionType.REFUND,
        status: TransactionStatus.COMPLETED,
        amount: refundAmount,
        currency: 'KES',
        paystackRef: refundResult.paystackRefundId,
        description: `Dispute resolution refund - ${resolutionNotes.slice(0, 100)}`,
        metadata: {
          disputeId: dispute.id,
          resolutionType: 'dispute_refund',
          adminId: adminId,
          originalTransactionId: originalTransaction.id
        }
      }
    })

    return {
      transactionId: refundTransaction.id,
      paystackRefundId: refundResult.paystackRefundId
    }
  }

  /**
   * Process payout for talent
   */
  private static async processPayout(
    tx: any,
    dispute: any,
    payoutAmount: number,
    resolutionNotes: string,
    adminId: string
  ) {
    // Create payout record
    await tx.payout.create({
      data: {
        talentId: dispute.Booking.talentId,
        bookingId: dispute.Booking.id,
        amount: payoutAmount,
        status: PayoutStatus.PENDING,
        payoutMethod: 'MPESA',
        metadata: {
          disputeId: dispute.id,
          resolutionType: 'dispute_payout',
          adminId: adminId,
          originalAmount: parseFloat(dispute.Booking.amount.toString()),
          disputeResolutionFee: parseFloat(dispute.Booking.amount.toString()) * DISPUTE_RESOLUTION_FEE_PERCENTAGE
        }
      }
    })

    // Create payout transaction record
    const payoutTransaction = await tx.transaction.create({
      data: {
        bookingId: dispute.Booking.id,
        userId: dispute.Booking.talentId,
        type: TransactionType.TALENT_PAYOUT,
        status: TransactionStatus.PENDING,
        amount: payoutAmount,
        currency: 'KES',
        description: `Dispute resolution payout - ${resolutionNotes.slice(0, 100)}`,
        metadata: {
          disputeId: dispute.id,
          resolutionType: 'dispute_payout',
          adminId: adminId,
          disputeResolutionFee: parseFloat(dispute.Booking.amount.toString()) * DISPUTE_RESOLUTION_FEE_PERCENTAGE
        }
      }
    })

    // Update booking payout status
    await tx.booking.update({
      where: { id: dispute.Booking.id },
      data: { isPaidOut: true }
    })

    return {
      transactionId: payoutTransaction.id
    }
  }

  /**
   * Create audit log entry for dispute resolution
   */
  private static async createAuditLogEntry(
    tx: any,
    adminId: string,
    dispute: any,
    resolution: string,
    resolutionNotes: string,
    financialBreakdown: DisputeFinancialBreakdown
  ) {
    const admin = await tx.user.findUnique({
      where: { id: adminId },
      select: { email: true }
    })

    await tx.adminAuditLog.create({
      data: {
        adminId: adminId,
        adminEmail: admin?.email || 'unknown',
        targetUserId: dispute.disputedById,
        targetUserEmail: dispute.User?.email || 'unknown',
        action: 'DISPUTE_RESOLVED',
        details: JSON.stringify({
          disputeId: dispute.id,
          bookingId: dispute.Booking.id,
          resolution: resolution,
          resolutionNotes: resolutionNotes,
          financialBreakdown: financialBreakdown,
          eventTitle: dispute.Booking.Event?.title || 'Unknown Event'
        }),
        ipAddress: null, // Could be passed from request if needed
        userAgent: null
      }
    })
  }

  /**
   * Send notifications to all parties about dispute resolution
   */
  private static async sendResolutionNotifications(
    dispute: any,
    resolution: string,
    resolutionNotes: string
  ) {
    const eventTitle = dispute.Booking?.Event?.title || 'Unknown Event'
    const resolutionMessage = `Your dispute for booking "${eventTitle}" has been resolved. Resolution: ${resolutionNotes}`

    const notifications = [
      // Notify organizer
      createNotification({
        userId: dispute.Booking.organizerId,
        type: NotificationType.DISPUTE_RESOLVED,
        title: 'Dispute Resolved',
        message: resolutionMessage,
        bookingId: dispute.Booking.id,
        actionUrl: '/organizer/disputes'
      }),
      
      // Notify talent
      createNotification({
        userId: dispute.Booking.talentId,
        type: NotificationType.DISPUTE_RESOLVED,
        title: 'Dispute Resolved',
        message: resolutionMessage,
        bookingId: dispute.Booking.id,
        actionUrl: '/talent/disputes'
      })
    ]

    // Send all notifications
    await Promise.allSettled(notifications)
  }

  /**
   * Get dispute resolution statistics for admin dashboard
   */
  static async getDisputeResolutionStats(dateRange?: { start: Date; end: Date }) {
    const whereClause = dateRange ? {
      resolvedAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    } : {
      resolvedAt: { not: null }
    }

    const stats = await prisma.dispute.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      },
      _sum: {
        refundAmount: true,
        payoutAmount: true
      }
    })

    const totalResolved = stats.reduce((sum, stat) => sum + stat._count.id, 0)
    const totalRefunds = stats.reduce((sum, stat) => sum + (parseFloat(stat._sum.refundAmount?.toString() || '0')), 0)
    const totalPayouts = stats.reduce((sum, stat) => sum + (parseFloat(stat._sum.payoutAmount?.toString() || '0')), 0)

    return {
      totalResolved,
      totalRefunds,
      totalPayouts,
      resolutionBreakdown: stats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        totalRefunds: parseFloat(stat._sum.refundAmount?.toString() || '0'),
        totalPayouts: parseFloat(stat._sum.payoutAmount?.toString() || '0')
      }))
    }
  }
}
