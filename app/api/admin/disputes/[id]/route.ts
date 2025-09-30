
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { UserRole, DisputeStatus, BookingStatus, TransactionType, TransactionStatus } from '@prisma/client'
import { DisputeResolutionService } from '@/lib/services/disputeService'

export const dynamic = "force-dynamic"

interface DisputeWithRelations {
  id: string
  bookingId: string | null
  status: DisputeStatus
  Booking: {
    id: string
    organizerId: string
    talentId: string
    amount: any
    talentAmount: any
    Event: {
      title: string
    } | null
    User_Booking_organizerIdToUser: any
    User_Booking_talentIdToUser: any
    Transaction: any[]
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      )
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        Booking: {
          include: {
            Event: true,
            User_Booking_organizerIdToUser: {
              select: {
                id: true,
                name: true,
                email: true,
                OrganizerProfile: true
              }
            },
            User_Booking_talentIdToUser: {
              select: {
                id: true,
                name: true,
                email: true,
                TalentProfile: true
              }
            },
            Message: {
              include: {
                User_Message_senderIdToUser: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            },
            Transaction: {
              orderBy: { createdAt: 'desc' }
            },
            Review: {
              include: {
                User_Review_giverIdToUser: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Transform the dispute data to match frontend expectations
    const transformedDispute = {
      ...dispute,
      booking: dispute.Booking ? {
        ...dispute.Booking,
        event: dispute.Booking.Event,
        organizer: dispute.Booking.User_Booking_organizerIdToUser,
        talent: dispute.Booking.User_Booking_talentIdToUser,
        messages: dispute.Booking.Message,
        transactions: dispute.Booking.Transaction,
        reviews: dispute.Booking.Review
      } : null,
      disputedBy: dispute.User,
      // Remove the original Prisma relation names to avoid confusion
      Booking: undefined,
      User: undefined
    }

    return NextResponse.json({
      success: true,
      data: transformedDispute
    })

  } catch (error) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      )
    }

    const { 
      resolution, 
      resolutionNotes, 
      refundAmount, 
      payoutAmount 
    } = await request.json()

    // Use the comprehensive dispute resolution service
    const result = await DisputeResolutionService.resolveDispute({
      disputeId: params.id,
      adminId: session.user.id,
      resolution,
      resolutionNotes,
      refundAmount,
      payoutAmount
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message
    })

  } catch (error) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
