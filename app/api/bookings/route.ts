
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus, NotificationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const skip = (page - 1) * limit

    // Build filter conditions based on user role
    const where: any = {}

    if (session.user.role === UserRole.ADMIN) {
      // Admin can see all bookings
      if (status && status !== 'ALL') {
        where.status = status as BookingStatus
      }
    } else {
      // Regular users see only their bookings
      if (session.user.role === UserRole.ORGANIZER) {
        where.organizerId = session.user.id
      } else if (session.user.role === UserRole.TALENT) {
        where.talentId = session.user.id
      }
      
      if (status && status !== 'ALL') {
        where.status = status as BookingStatus
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            location: true,
            eventDate: true,
            duration: true,
          },
        },
        User_Booking_organizerIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            OrganizerProfile: {
              select: {
                companyName: true,
                location: true,
              },
            },
          },
        },
        User_Booking_talentIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            verificationStatus: true,
            TalentProfile: {
              select: {
                category: true,
                location: true,
                averageRating: true,
              },
            },
          },
        },
        Message: {
          select: {
            id: true,
            isRead: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        Review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            giverId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
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
      organizer: {
        ...booking.User_Booking_organizerIdToUser,
        organizerProfile: booking.User_Booking_organizerIdToUser.OrganizerProfile,
      },
      talent: {
        ...booking.User_Booking_talentIdToUser,
        talentProfile: booking.User_Booking_talentIdToUser.TalentProfile,
      },
      unreadMessages: booking.Message?.filter((msg: any) => !msg.isRead && msg.senderId !== session.user.id).length || 0,
      reviews: booking.Review,
    }))

    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBookings / limit),
          totalItems: totalBookings,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Only organizers can create bookings' }, { status: 401 })
    }

    const { talentId, packageId, eventDate, venue, message, customAmount } = await request.json()

    if (!talentId || !eventDate || !venue) {
      return NextResponse.json(
        { error: 'Talent ID, event date, and venue are required' },
        { status: 400 }
      )
    }

    // Get package details if packageId is provided
    let packageDetails = null
    let bookingAmount = customAmount

    if (packageId) {
      packageDetails = await prisma.package.findUnique({
        where: { id: packageId, isActive: true, isPublished: true },
        include: {
          TalentProfile: {
            include: {
              User: true,
            },
          },
        },
      })

      if (!packageDetails || packageDetails.TalentProfile.User.id !== talentId) {
        return NextResponse.json(
          { error: 'Package not found or does not belong to the specified talent' },
          { status: 404 }
        )
      }

      if (!packageDetails.priceIsHidden) {
        bookingAmount = Number(packageDetails.price)
      }
    }

    if (!bookingAmount || bookingAmount <= 0) {
      return NextResponse.json(
        { error: 'Booking amount is required' },
        { status: 400 }
      )
    }

    // Check if talent is active and verified
    const talent = await prisma.user.findUnique({
      where: { id: talentId },
      include: {
        TalentProfile: {
          select: {
            category: true,
          },
        },
      },
    })

    if (!talent || !talent.isActive) {
      return NextResponse.json(
        { error: 'Talent not found or inactive' },
        { status: 404 }
      )
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        organizerId: session.user.id,
        title: packageDetails?.title || 'Custom Booking',
        description: packageDetails?.description || message || 'Custom booking request',
        category: packageDetails?.category || talent.TalentProfile?.category || 'General',
        location: venue,
        eventDate: new Date(eventDate),
        budget: bookingAmount,
        isPublic: false,
      },
    })

    // Calculate fees
    const platformFeePercentage = 0.10 // 10%
    const platformFee = bookingAmount * platformFeePercentage
    const talentAmount = bookingAmount - platformFee

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        eventId: event.id,
        organizerId: session.user.id,
        talentId,
        amount: bookingAmount,
        platformFee,
        talentAmount,
        proposedDate: new Date(eventDate),
        notes: message,
        status: BookingStatus.PENDING,
      },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            category: true,
            location: true,
            eventDate: true,
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
            TalentProfile: {
              select: {
                category: true,
              },
            },
          },
        },
      },
    })

    // Notify talent
    await prisma.notification.create({
      data: {
        userId: talentId,
        type: NotificationType.BOOKING_REQUEST,
        title: 'New Booking Request',
        message: `You have a new booking request for "${event.title}" from ${session.user.name}`,
        bookingId: booking.id,
        eventId: event.id,
        actionUrl: `/talent/bookings/${booking.id}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking.id,
        eventId: event.id,
        amount: bookingAmount,
        platformFee,
        talentAmount,
        status: booking.status,
      },
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
