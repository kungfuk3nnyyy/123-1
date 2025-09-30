
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface DisputeWithRelations {
  id: string
  bookingId: string | null
  reason: string
  explanation: string
  status: string
  createdAt: Date
  resolvedAt: Date | null
  resolutionNotes: string | null
  refundAmount: any | null
  payoutAmount: any | null
  Booking: {
    Event: {
      id: string
      title: string
      eventDate: Date | null
      location: string
    } | null
    User_Booking_organizerIdToUser: {
      id: string
      name: string | null
      email: string
    } | null
    User_Booking_talentIdToUser: {
      id: string
      name: string | null
      email: string
    } | null
    Transaction: {
      amount: any
      status: string
      type: string
    }[]
  } | null
  User: {
    id: string
    name: string | null
    email: string
    role: UserRole
  } | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const reason = searchParams.get('reason')
    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (reason && reason !== 'ALL') {
      where.reason = reason
    }

    // Get disputes with proper relations including complete user data
    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        Booking: {
          include: {
            Event: {
              select: {
                id: true,
                title: true,
                eventDate: true,
                location: true,
              },
            },
            User_Booking_organizerIdToUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            User_Booking_talentIdToUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            Transaction: {
              select: {
                amount: true,
                status: true,
                type: true,
              },
              orderBy: { createdAt: 'desc' }
            },
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    // Get total count for pagination
    const totalDisputes = await prisma.dispute.count({ where })

    // Format response data with complete information
    const formattedDisputes = disputes.map((dispute: DisputeWithRelations) => ({
      id: dispute.id,
      bookingId: dispute.bookingId,
      eventTitle: dispute.Booking?.Event?.title || 'N/A',
      eventLocation: dispute.Booking?.Event?.location || 'N/A',
      eventDate: dispute.Booking?.Event?.eventDate || null,
      organizerName: dispute.Booking?.User_Booking_organizerIdToUser?.name || 'N/A',
      organizerEmail: dispute.Booking?.User_Booking_organizerIdToUser?.email || 'N/A',
      organizerId: dispute.Booking?.User_Booking_organizerIdToUser?.id || 'N/A',
      talentName: dispute.Booking?.User_Booking_talentIdToUser?.name || 'N/A',
      talentEmail: dispute.Booking?.User_Booking_talentIdToUser?.email || 'N/A',
      talentId: dispute.Booking?.User_Booking_talentIdToUser?.id || 'N/A',
      disputedBy: {
        id: dispute.User?.id || 'N/A',
        name: dispute.User?.name || 'N/A',
        email: dispute.User?.email || 'N/A',
        role: dispute.User?.role || 'N/A',
      },
      reason: dispute.reason,
      explanation: dispute.explanation,
      status: dispute.status,
      amount: dispute.Booking?.Transaction?.[0]?.amount ? Number(dispute.Booking.Transaction[0].amount) : 0,
      createdAt: dispute.createdAt.toISOString(),
      resolvedAt: dispute.resolvedAt?.toISOString() || null,
      resolutionNotes: dispute.resolutionNotes,
      refundAmount: dispute.refundAmount ? Number(dispute.refundAmount) : null,
      payoutAmount: dispute.payoutAmount ? Number(dispute.payoutAmount) : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        disputes: formattedDisputes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalDisputes / limit),
          totalItems: totalDisputes,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}
