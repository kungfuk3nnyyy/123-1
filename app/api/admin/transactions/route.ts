
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit

    // Build search conditions
    const searchConditions: any = {}

    if (type && type !== 'ALL') {
      searchConditions.type = type
    }

    if (status && status !== 'ALL') {
      searchConditions.status = status
    }

    if (search) {
      searchConditions.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { paystackRef: { contains: search, mode: 'insensitive' } },
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where: searchConditions,
      include: {
        Booking: {
          select: {
            id: true,
            Event: {
              select: {
                title: true,
              },
            },
            User_Booking_talentIdToUser: {
              select: {
                name: true,
              },
            },
            User_Booking_organizerIdToUser: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    const totalTransactions = await prisma.transaction.count({
      where: searchConditions,
    })

    // Format transactions data
    const formattedTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type,
      user: transaction.Booking?.User_Booking_talentIdToUser?.name || transaction.Booking?.User_Booking_organizerIdToUser?.name || 'Platform',
      bookingId: transaction.Booking?.id || 'N/A',
      eventTitle: transaction.Booking?.Event?.title || 'N/A',
      amount: Number(transaction.amount),
      status: transaction.status,
      date: transaction.createdAt.toISOString(),
      description: transaction.description,
      paystackRef: transaction.paystackRef,
      currency: transaction.currency,
    }))

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit),
          totalItems: totalTransactions,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
