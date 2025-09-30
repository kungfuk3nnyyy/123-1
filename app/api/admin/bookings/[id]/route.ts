

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface BookingWithRelations {
  id: string
  status: string
  amount: any
  platformFee: any
  talentAmount: any
  notes: string | null
  createdAt: Date
  updatedAt: Date
  User_Booking_organizerIdToUser: {
    id: string
    name: string | null
    email: string
    OrganizerProfile: {
      companyName: string | null
      phoneNumber: string | null
      location: string | null
    } | null
  } | null
  User_Booking_talentIdToUser: {
    id: string
    name: string | null
    email: string
    TalentProfile: {
      category: string | null
      phoneNumber: string | null
      averageRating: any | null
    } | null
  } | null
  Event: {
    id: string
    title: string
    description: string
    location: string
    eventDate: Date | null
    duration: number | null
  } | null
  Transaction: TransactionData[]
  Message: MessageData[]
  Review: ReviewData[]
  Dispute: DisputeData[]
}

interface TransactionData {
  id: string
  type: string
  status: string
  amount: any
  description: string | null
  createdAt: Date
}

interface MessageData {
  id: string
  content: string
  isRead: boolean
  createdAt: Date
  User_Message_senderIdToUser: {
    name: string | null
    email: string
    role: UserRole
  } | null
}

interface ReviewData {
  id: string
  rating: number
  comment: string
  reviewerType: string
  isVisible: boolean
  createdAt: Date
  User_Review_giverIdToUser: {
    name: string | null
    email: string
    role: UserRole
  } | null
}

interface DisputeData {
  id: string
  reason: string
  explanation: string
  status: string
  createdAt: Date
  User: {
    name: string | null
    email: string
    role: UserRole
  } | null
}

// GET - Get detailed booking information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        User_Booking_organizerIdToUser: {
          include: {
            OrganizerProfile: true
          }
        },
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Event: true,
        Transaction: {
          orderBy: { createdAt: 'desc' }
        },
        Message: {
          include: {
            User_Message_senderIdToUser: {
              select: { name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        Review: {
          include: {
            User_Review_giverIdToUser: {
              select: { name: true, email: true, role: true }
            }
          }
        },
        Dispute: {
          include: {
            User: {
              select: { name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const typedBooking = booking as BookingWithRelations

    // Format the response
    const formattedBooking = {
      id: typedBooking.id,
      status: typedBooking.status,
      amount: Number(typedBooking.amount),
      platformFee: Number(typedBooking.platformFee),
      talentAmount: Number(typedBooking.talentAmount),
      notes: typedBooking.notes,
      createdAt: typedBooking.createdAt.toISOString(),
      updatedAt: typedBooking.updatedAt.toISOString(),
      
      organizer: {
        id: typedBooking.User_Booking_organizerIdToUser?.id,
        name: typedBooking.User_Booking_organizerIdToUser?.name,
        email: typedBooking.User_Booking_organizerIdToUser?.email,
        companyName: typedBooking.User_Booking_organizerIdToUser?.OrganizerProfile?.companyName,
        phoneNumber: typedBooking.User_Booking_organizerIdToUser?.OrganizerProfile?.phoneNumber,
        location: typedBooking.User_Booking_organizerIdToUser?.OrganizerProfile?.location
      },
      
      talent: {
        id: typedBooking.User_Booking_talentIdToUser?.id,
        name: typedBooking.User_Booking_talentIdToUser?.name,
        email: typedBooking.User_Booking_talentIdToUser?.email,
        category: typedBooking.User_Booking_talentIdToUser?.TalentProfile?.category,
        phoneNumber: typedBooking.User_Booking_talentIdToUser?.TalentProfile?.phoneNumber,
        averageRating: typedBooking.User_Booking_talentIdToUser?.TalentProfile?.averageRating 
          ? Number(typedBooking.User_Booking_talentIdToUser.TalentProfile.averageRating) 
          : null
      },
      
      event: {
        id: typedBooking.Event?.id,
        title: typedBooking.Event?.title,
        description: typedBooking.Event?.description,
        location: typedBooking.Event?.location,
        eventDate: typedBooking.Event?.eventDate?.toISOString(),
        duration: typedBooking.Event?.duration
      },
      
      transactions: typedBooking.Transaction?.map((t: TransactionData) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        amount: Number(t.amount),
        description: t.description,
        createdAt: t.createdAt.toISOString()
      })) || [],
      
      messages: typedBooking.Message?.map((m: MessageData) => ({
        id: m.id,
        content: m.content,
        isRead: m.isRead,
        sender: {
          name: m.User_Message_senderIdToUser?.name,
          email: m.User_Message_senderIdToUser?.email,
          role: m.User_Message_senderIdToUser?.role
        },
        createdAt: m.createdAt.toISOString()
      })) || [],
      
      reviews: typedBooking.Review?.map((r: ReviewData) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewerType: r.reviewerType,
        isVisible: r.isVisible,
        giver: {
          name: r.User_Review_giverIdToUser?.name,
          email: r.User_Review_giverIdToUser?.email,
          role: r.User_Review_giverIdToUser?.role
        },
        createdAt: r.createdAt.toISOString()
      })) || [],
      
      disputes: typedBooking.Dispute?.map((d: DisputeData) => ({
        id: d.id,
        reason: d.reason,
        explanation: d.explanation,
        status: d.status,
        disputedBy: {
          name: d.User?.name,
          email: d.User?.email,
          role: d.User?.role
        },
        createdAt: d.createdAt.toISOString()
      })) || []
    }

    return NextResponse.json({
      success: true,
      booking: formattedBooking
    })

  } catch (error) {
    console.error('Admin booking detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
