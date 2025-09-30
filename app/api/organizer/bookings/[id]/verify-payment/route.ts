import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TransactionStatus } from '@prisma/client'
import { processPaymentSuccess } from '@/lib/payment/payment-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = params.id

    // Get the latest transaction for this booking with all required relations
    const transaction = await prisma.transaction.findFirst({
      where: { 
        bookingId,
        userId: session.user.id 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Booking: {
          include: {
            User_Booking_talentIdToUser: true,
            User_Booking_organizerIdToUser: true,
            Event: true
          }
        },
        User: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'No transaction found' }, { status: 404 })
    }

    // If already completed, return current status
    if (transaction.status === TransactionStatus.COMPLETED) {
      return NextResponse.json({ 
        success: true, 
        status: 'completed',
        transaction 
      })
    }

    // Process the payment using the shared utility function
    if (!transaction.paystackRef) {
      throw new Error('Transaction reference not found')
    }
    const result = await processPaymentSuccess(transaction.paystackRef, 'redirect')

    // Get the updated transaction with related data
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        Booking: {
          include: {
            Event: true,
            User_Booking_talentIdToUser: true,
            User_Booking_organizerIdToUser: true
          }
        }
      }
    })

    return NextResponse.json({
      success: result.success,
      status: result.success ? 'completed' : 'pending',
      bookingId: result.bookingId,
      transactionId: result.transactionId,
      amount: result.amount,
      transaction: updatedTransaction
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
