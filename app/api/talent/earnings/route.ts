


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, TransactionStatus, TransactionType } from '@prisma/client'
import { BookingCompletionService } from '@/lib/booking-completion-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as TransactionStatus | undefined

    // Use the centralized service for fetching talent earnings
    const [transactionsResult, summaryResult] = await Promise.all([
      BookingCompletionService.getTalentPayoutTransactions(session.user.id, {
        page,
        limit,
        status
      }),
      BookingCompletionService.getTalentEarningsSummary(session.user.id)
    ])

    if (!transactionsResult.success) {
      console.error('Failed to fetch talent transactions:', transactionsResult.error)
      return NextResponse.json({ 
        error: 'Failed to fetch earnings data' 
      }, { status: 500 })
    }

    if (!summaryResult.success) {
      console.error('Failed to fetch talent earnings summary:', summaryResult.error)
      return NextResponse.json({ 
        error: 'Failed to fetch earnings summary' 
      }, { status: 500 })
    }

    // Format the response data
    const formattedTransactions = transactionsResult.transactions.map((transaction: any) => ({
      id: transaction.id,
      amount: Number(transaction.amount),
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      currency: transaction.currency,
      metadata: transaction.metadata,
      booking: transaction.Booking ? {
        id: transaction.Booking.id,
        event: transaction.Booking.Event ? {
          title: transaction.Booking.Event.title,
          eventDate: transaction.Booking.Event.eventDate
        } : null,
        organizer: transaction.Booking.User_Booking_organizerIdToUser ? {
          name: transaction.Booking.User_Booking_organizerIdToUser.name,
          companyName: transaction.Booking.User_Booking_organizerIdToUser.OrganizerProfile?.companyName
        } : null
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        summary: summaryResult.summary,
        pagination: transactionsResult.pagination
      }
    })
  } catch (error) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

