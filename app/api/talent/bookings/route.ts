

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {
      talentId: session.user.id
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Fetch bookings and talent profile in parallel
    const [bookings, totalCount, talentProfile] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          Event: true,
          User_Booking_organizerIdToUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          Review: {
            include: {
              User_Review_giverIdToUser: {
                select: {
                  id: true,
                  name: true
                }
              },
              User_Review_receiverIdToUser: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          Message: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.booking.count({
        where: whereClause
      }),
      prisma.talentProfile.findUnique({
        where: {
          userId: session.user.id
        },
        select: {
          bio: true,
          category: true,
          skills: true,
          location: true,
          hourlyRate: true
        }
      })
    ])

    // Map bookings to match frontend expectations
    const formattedBookings = bookings.map((b) => ({
      id: b.id,
      status: b.status,
      amount: b.amount,
      platformFee: b.platformFee,
      talentAmount: b.talentAmount,
      gross_amount: b.amount, // original booking amount
      platform_fee: b.platformFee,
      net_payout_amount: b.talentAmount,
      proposedDate: b.proposedDate,
      acceptedDate: b.acceptedDate,
      completedDate: b.completedDate,
      notes: b.notes,
      event: {
        id: b.Event.id,
        title: b.Event.title,
        description: b.Event.description,
        location: b.Event.location,
        eventDate: b.Event.eventDate,
        duration: b.Event.duration,
      },
      organizer: {
        id: b.User_Booking_organizerIdToUser.id,
        name: b.User_Booking_organizerIdToUser.name,
        email: b.User_Booking_organizerIdToUser.email,
        organizerProfile: {
          companyName: (b.User_Booking_organizerIdToUser as any).OrganizerProfile?.companyName || null,
          phoneNumber: (b.User_Booking_organizerIdToUser as any).OrganizerProfile?.phoneNumber || null,
        }
      },
      disputes: (b as any).Dispute || [],
      reviews: b.Review || [],
      createdAt: b.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        talentProfile: talentProfile,
        pagination: {
          total: totalCount,
          limit,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(totalCount / limit),
          hasMore: offset + limit < totalCount,
        }
      }
    })

  } catch (error) {
    console.error('Talent bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
