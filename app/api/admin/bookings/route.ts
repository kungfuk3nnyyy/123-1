
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus, DisputeStatus, TransactionType, TransactionStatus, NotificationType, Prisma, DisputeReason } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Define types for better type safety
// Type for the booking with relations
interface BookingWithRelations {
  id: string
  status: BookingStatus
  amount: Prisma.Decimal
  platformFee: Prisma.Decimal
  talentAmount: Prisma.Decimal
  talentId: string
  organizerId: string
  eventId: string
  isPaidOut: boolean
  proposedDate: Date | null
  acceptedDate: Date | null
  completedDate: Date | null
  notes: string | null
  eventEndDateTime: Date | null
  createdAt: Date
  updatedAt: Date
  User_Booking_organizerIdToUser?: {
    name: string | null
    email: string
    OrganizerProfile?: {
      companyName: string | null
    } | null
  } | null
  User_Booking_talentIdToUser?: {
    name: string | null
    email: string
    TalentProfile?: {
      category: string | null
      skills?: string[]
    } | null
  } | null
  Event?: {
    title: string
    eventDate: Date | null
    location: string | null
  } | null
  Dispute: Array<{
    id: string
    status: DisputeStatus
    createdAt: Date
    updatedAt: Date
    bookingId: string
    disputedById: string
    reason: DisputeReason
    explanation: string
    resolvedById: string | null
    resolutionNotes: string | null
    refundAmount: Prisma.Decimal | null
    payoutAmount: Prisma.Decimal | null
    resolvedAt: Date | null
  }>
  Transaction: Array<{
    id: string
    bookingId: string
    userId: string
    metadata: Prisma.JsonValue | null
    type: TransactionType
    status: TransactionStatus
    amount: number
    currency: string
    paystackRef: string | null
    paystackData: Prisma.JsonValue | null
    description: string | null
    createdAt: Date
    updatedAt: Date
  }>
  _count?: {
    Message: number
  }
}

interface BookingUpdateData {
  id: string
  status: BookingStatus
  amount: Prisma.Decimal | number
  platformFee: Prisma.Decimal | number
  talentAmount: Prisma.Decimal | number
  talentId: string
  organizerId: string
  notes?: string | null
  Event?: {
    title?: string
  } | null
}

/**
 * Helper function to create TALENT_PAYOUT transaction
 * Prevents duplicate payout creation and handles errors gracefully
 */
async function createTalentPayoutTransaction(bookingId: string, talentId: string, amount: number, eventTitle: string) {
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
      console.log(`TALENT_PAYOUT transaction already exists for booking ${bookingId}`)
      return existingPayout
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
          createdBy: 'admin',
          reason: 'booking_completion',
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`✅ Created TALENT_PAYOUT transaction ${payoutTransaction.id} for booking ${bookingId}`)
    return payoutTransaction

  } catch (error) {
    console.error(`❌ Failed to create TALENT_PAYOUT transaction for booking ${bookingId}:`, error)
    // Don't throw error - booking completion should not fail if payout creation fails
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as BookingStatus | null
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && Object.values(BookingStatus).includes(status)) {
      where.status = status
    }

    if (search) {
      where.OR = [
        {
          User_Booking_organizerIdToUser: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          User_Booking_talentIdToUser: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          Event: {
            title: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    // Get bookings with relations
    const [bookings, totalBookings] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          User_Booking_organizerIdToUser: {
            select: {
              name: true,
              email: true,
              OrganizerProfile: {
                select: {
                  companyName: true
                }
              }
            }
          },
          User_Booking_talentIdToUser: {
            select: {
              name: true,
              email: true,
              TalentProfile: {
                select: {
                  category: true
                }
              }
            }
          },
          Event: {
            select: {
              title: true,
              eventDate: true,
              location: true
            }
          },
          Dispute: true,
          Transaction: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              Message: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ])

    // Get summary statistics
    const [
      totalBookingsCount,
      pendingBookings,
      acceptedBookings,
      completedBookings,
      disputedBookings,
      totalRevenue
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.booking.count({ where: { status: BookingStatus.ACCEPTED } }),
      prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.booking.count({ where: { status: BookingStatus.DISPUTED } }),
      prisma.booking.aggregate({
        where: { status: BookingStatus.COMPLETED },
        _sum: { amount: true }
      })
    ])

    const stats = {
      totalBookings: totalBookingsCount,
      pendingBookings,
      acceptedBookings,
      completedBookings,
      disputedBookings,
      totalRevenue: Number(totalRevenue._sum.amount || 0)
    }

    const pagination = {
      total: totalBookings,
      page,
      limit,
      pages: Math.ceil(totalBookings / limit)
    }

    // Format bookings data
    const formattedBookings = bookings.map((booking: BookingWithRelations) => ({
      id: booking.id,
      organizerName: booking.User_Booking_organizerIdToUser?.name || 'Unnamed User',
      organizerEmail: booking.User_Booking_organizerIdToUser?.email,
      organizerCompany: booking.User_Booking_organizerIdToUser?.OrganizerProfile?.companyName,
      talentName: booking.User_Booking_talentIdToUser?.name || 'Unnamed User',
      talentEmail: booking.User_Booking_talentIdToUser?.email,
      talentCategory: booking.User_Booking_talentIdToUser?.TalentProfile?.category,
      eventTitle: booking.Event?.title,
      eventDate: booking.Event?.eventDate?.toISOString(),
      eventLocation: booking.Event?.location,
      amount: typeof booking.amount === 'number' ? booking.amount : booking.amount.toNumber(),
      platformFee: typeof booking.platformFee === 'number' ? booking.platformFee : booking.platformFee.toNumber(),
      talentAmount: typeof booking.talentAmount === 'number' ? booking.talentAmount : booking.talentAmount.toNumber(),
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      hasDisputes: (booking.Dispute?.length ?? 0) > 0,
      messageCount: booking._count?.Message || 0,
      transactionStatus: booking.Transaction?.[0]?.status || TransactionStatus.PENDING,
      paystackRef: booking.Transaction?.[0]?.paystackRef || null
    }))

    return NextResponse.json({
      success: true,
      bookings: formattedBookings,
      stats,
      pagination
    })

  } catch (error) {
    console.error('Admin bookings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Override booking status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, status, notes } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate status
    if (!Object.values(BookingStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        User_Booking_organizerIdToUser: { select: { name: true, email: true } },
        User_Booking_talentIdToUser: { select: { name: true, email: true } },
        Event: { select: { title: true } }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const typedBooking = booking as BookingUpdateData

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status as BookingStatus,
        notes: notes || typedBooking.notes,
        ...(status === BookingStatus.COMPLETED && { completedDate: new Date() })
      }
    })

    // If status is being changed to COMPLETED, create TALENT_PAYOUT transaction
    if (status === BookingStatus.COMPLETED && typedBooking.status !== BookingStatus.COMPLETED) {
      // Create TALENT_PAYOUT transaction
      const payoutAmount = Number(typedBooking.talentAmount || typedBooking.amount)
      await createTalentPayoutTransaction(
        bookingId,
        typedBooking.talentId,
        payoutAmount,
        booking.Event?.title || 'booking'
      )

      // Notify talent about booking completion
      await prisma.notification.create({
        data: {
          userId: typedBooking.talentId,
          type: NotificationType.BOOKING_COMPLETED,
          title: 'Booking Completed',
          message: `Your booking for "${booking.Event?.title || 'the event'}" has been completed by admin. Payout is being processed.`,
          bookingId: bookingId,
          actionUrl: `/talent/bookings/${bookingId}`,
        },
      })
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'ADMIN_BOOKING_STATUS_OVERRIDE',
        description: `Admin overrode booking status to ${status}`,
        metadata: {
          bookingId,
          oldStatus: typedBooking.status,
          newStatus: status,
          notes
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Booking status updated to ${status}`
    })

  } catch (error) {
    console.error('Admin booking update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

