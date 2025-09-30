
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {
      organizerId: session.user.id
    }

    if (status && status !== 'ALL') {
      where.status = status as BookingStatus
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Event: true,
        Transaction: true,
        Review: {
          select: {
            id: true,
            giverId: true,
            reviewerType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    })

    const totalBookings = await prisma.booking.count({ where })

    // Format bookings data
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      status: booking.status,
      amount: Number(booking.amount),
      platformFee: Number(booking.platformFee),
      talentAmount: Number(booking.talentAmount),
      proposedDate: booking.proposedDate,
      acceptedDate: booking.acceptedDate,
      completedDate: booking.completedDate,
      notes: booking.notes,
      createdAt: booking.createdAt,
      event: booking.Event,
      talent: {
        ...booking.User_Booking_talentIdToUser,
        talentProfile: booking.User_Booking_talentIdToUser.TalentProfile
      },
      transactions: booking.Transaction,
      reviews: booking.Review,
      canReview: booking.status === BookingStatus.COMPLETED && 
                !booking.Review.some((review: any) => review.giverId === session.user.id)
    }))

    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBookings / limit),
          totalItems: totalBookings,
          itemsPerPage: limit
        }
      }
    })

  } catch (error) {
    console.error('Error fetching organizer bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
