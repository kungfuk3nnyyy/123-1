import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TransactionStatus } from '@prisma/client'

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

    // Import the processPaymentSuccess function from your callback route
    const { processPaymentSuccess } = await import('../payment/callback/route')
    const result = await processPaymentSuccess(transaction.paystackRef, 'redirect')

    return NextResponse.json({
      success: true,
      status: result.success ? 'completed' : 'pending',
      transaction: result.transaction
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
