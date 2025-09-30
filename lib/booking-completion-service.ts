

import { prisma } from '@/lib/db'
import { TransactionType, TransactionStatus } from '@prisma/client'

/**
 * Centralized service for handling booking completion and talent payout creation
 * This ensures consistent behavior across all booking completion endpoints
 */
export class BookingCompletionService {
  
  /**
   * Creates a TALENT_PAYOUT transaction for a completed booking
   * Prevents duplicate payout creation and handles errors gracefully
   * 
   * @param bookingId - The ID of the completed booking
   * @param talentId - The ID of the talent to receive the payout
   * @param amount - The payout amount
   * @param eventTitle - The title of the event for description
   * @param createdBy - Who/what created this payout (for audit trail)
   * @returns The created transaction or existing transaction if already exists
   */
  static async createTalentPayoutTransaction(
    bookingId: string, 
    talentId: string, 
    amount: number, 
    eventTitle: string,
    createdBy: string = 'system'
  ) {
    try {
      // Check if TALENT_PAYOUT transaction already exists for this booking
      const existingPayout = await prisma.transaction.findFirst({
        where: {
          bookingId: bookingId,
          userId: talentId,
          type: TransactionType.TALENT_PAYOUT
        }
      })

      if (existingPayout) {
        console.log(`✅ TALENT_PAYOUT transaction already exists for booking ${bookingId}`)
        return {
          success: true,
          transaction: existingPayout,
          created: false,
          message: 'Payout transaction already exists'
        }
      }

      // Validate amount
      if (amount <= 0) {
        console.error(`❌ Invalid payout amount ${amount} for booking ${bookingId}`)
        return {
          success: false,
          error: 'Invalid payout amount',
          created: false
        }
      }

      // Create new TALENT_PAYOUT transaction
      const payoutTransaction = await prisma.transaction.create({
        data: {
          bookingId: bookingId,
          userId: talentId,
          type: TransactionType.TALENT_PAYOUT,
          status: TransactionStatus.PENDING,
          amount: amount,
          currency: 'KES',
          description: `Payout for ${eventTitle}`,
          metadata: {
            createdBy: createdBy,
            reason: 'booking_completion',
            timestamp: new Date().toISOString(),
            eventTitle: eventTitle,
            bookingId: bookingId
          }
        }
      })

      console.log(`✅ Created TALENT_PAYOUT transaction ${payoutTransaction.id} for booking ${bookingId} (Amount: ${amount} KES)`)
      
      return {
        success: true,
        transaction: payoutTransaction,
        created: true,
        message: 'Payout transaction created successfully'
      }

    } catch (error) {
      console.error(`❌ Failed to create TALENT_PAYOUT transaction for booking ${bookingId}:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        created: false
      }
    }
  }

  /**
   * Validates if a booking can be completed
   * 
   * @param booking - The booking object to validate
   * @returns Validation result with success status and error message if applicable
   */
  static validateBookingCompletion(booking: any) {
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found'
      }
    }

    // Check if booking is already completed
    if (booking.status === 'COMPLETED') {
      return {
        success: false,
        error: 'Booking is already completed'
      }
    }

    // Check if booking is in a valid state for completion
    const validStatuses = ['IN_PROGRESS', 'ACCEPTED']
    if (!validStatuses.includes(booking.status)) {
      return {
        success: false,
        error: `Can only complete bookings that are ${validStatuses.join(' or ')}`
      }
    }

    // Validate required fields
    if (!booking.talentId) {
      return {
        success: false,
        error: 'Booking must have a talent assigned'
      }
    }

    if (!booking.talentAmount && !booking.amount) {
      return {
        success: false,
        error: 'Booking must have a valid amount'
      }
    }

    return {
      success: true
    }
  }

  /**
   * Gets the payout amount for a booking
   * Prioritizes talentAmount over amount
   * 
   * @param booking - The booking object
   * @returns The payout amount as a number
   */
  static getPayoutAmount(booking: any): number {
    return Number(booking.talentAmount || booking.amount || 0)
  }

  /**
   * Checks if a booking already has a TALENT_PAYOUT transaction
   * 
   * @param bookingId - The booking ID to check
   * @param talentId - The talent ID to check
   * @returns Boolean indicating if payout transaction exists
   */
  static async hasExistingPayoutTransaction(bookingId: string, talentId: string): Promise<boolean> {
    try {
      const existingPayout = await prisma.transaction.findFirst({
        where: {
          bookingId: bookingId,
          userId: talentId,
          type: TransactionType.TALENT_PAYOUT
        }
      })

      return !!existingPayout
    } catch (error) {
      console.error(`Error checking existing payout for booking ${bookingId}:`, error)
      return false
    }
  }

  /**
   * Gets all TALENT_PAYOUT transactions for a specific talent
   * Used by the earnings page
   * 
   * @param talentId - The talent ID
   * @param options - Query options (pagination, filters, etc.)
   * @returns Array of payout transactions
   */
  static async getTalentPayoutTransactions(
    talentId: string, 
    options: {
      page?: number
      limit?: number
      status?: TransactionStatus
      startDate?: Date
      endDate?: Date
    } = {}
  ) {
    const { page = 1, limit = 10, status, startDate, endDate } = options
    const skip = (page - 1) * limit

    const where: any = {
      userId: talentId,
      type: TransactionType.TALENT_PAYOUT
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    try {
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            Booking: {
              include: {
                Event: {
                  select: {
                    title: true,
                    eventDate: true
                  }
                },
                User_Booking_organizerIdToUser: {
                  select: {
                    name: true,
                    OrganizerProfile: {
                      select: {
                        companyName: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.transaction.count({ where })
      ])

      return {
        success: true,
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error(`Error fetching talent payout transactions for ${talentId}:`, error)
      return {
        success: false,
        error: 'Failed to fetch payout transactions',
        transactions: [],
        pagination: { page, limit, total: 0, pages: 0 }
      }
    }
  }

  /**
   * Gets summary statistics for talent earnings
   * 
   * @param talentId - The talent ID
   * @returns Summary object with total, pending, and completed earnings
   */
  static async getTalentEarningsSummary(talentId: string) {
    try {
      const [totalEarnings, pendingPayouts, completedPayouts] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId: talentId,
            type: TransactionType.TALENT_PAYOUT
          }
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId: talentId,
            type: TransactionType.TALENT_PAYOUT,
            status: TransactionStatus.PENDING
          }
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId: talentId,
            type: TransactionType.TALENT_PAYOUT,
            status: TransactionStatus.COMPLETED
          }
        })
      ])

      return {
        success: true,
        summary: {
          totalEarnings: Number(totalEarnings._sum.amount || 0),
          pendingPayouts: Number(pendingPayouts._sum.amount || 0),
          completedPayouts: Number(completedPayouts._sum.amount || 0)
        }
      }
    } catch (error) {
      console.error(`Error fetching talent earnings summary for ${talentId}:`, error)
      return {
        success: false,
        error: 'Failed to fetch earnings summary',
        summary: {
          totalEarnings: 0,
          pendingPayouts: 0,
          completedPayouts: 0
        }
      }
    }
  }
}

