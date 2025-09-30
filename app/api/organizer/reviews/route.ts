
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus, ReviewerType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('GET /api/organizer/reviews called')
  
  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('Database connection successful')
  } catch (dbError) {
    console.error('Database connection error:', dbError)
    return NextResponse.json(
      { success: false, error: 'Database connection error', details: (dbError as Error).message },
      { status: 500 }
    )
  }
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get reviews given by this organizer
    console.log('Fetching reviews for organizer:', session.user.id)
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { giverId: session.user.id },
        include: {
          User_Review_receiverIdToUser: {
            include: {
              TalentProfile: true
            }
          },
          Booking: {
            include: {
              Event: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }).catch((err: Error) => {
        console.error('Error fetching reviews:', err)
        throw err
      }),
      prisma.review.count({
        where: { giverId: session.user.id }
      }).catch((err: Error) => {
        console.error('Error counting reviews:', err)
        throw err
      })
    ])
    
    console.log(`Found ${reviews.length} reviews out of ${total} total`)
    
    // Log the first review if exists to verify data structure
    if (reviews.length > 0) {
      console.log('Sample review data:', JSON.stringify(reviews[0], null, 2))
    }

    console.log('Fetching pending reviews (bookings without reviews)')
    
    // First, let's verify the BookingStatus enum values
    console.log('Available BookingStatus values:', Object.values(BookingStatus))
    
    // Get pending reviews (bookings that need reviews)
    const pendingReviews = await prisma.booking.findMany({
      where: {
        organizerId: session.user.id,
        status: BookingStatus.COMPLETED,
        Review: { 
          none: {} // Only bookings without reviews
        },
        Event: {
          eventDate: {
            lt: new Date() // Only past events
          }
        }
      },
      include: {
        Event: {
          select: {
            title: true
          }
        },
        User_Booking_talentIdToUser: {
          select: {
            id: true,
            name: true,
            TalentProfile: {
              select: {
                category: true
              }
            }
          }
        },
        Review: {
          select: {
            id: true
          }
        }
      },
      take: 5 // Limit to 5 for debugging
    }).catch((err: Error) => {
      console.error('Error fetching pending reviews:', err)
      throw err
    })
    
    console.log(`Found ${pendingReviews.length} pending reviews`)
    if (pendingReviews.length > 0) {
      console.log('Sample pending review data:', JSON.stringify(pendingReviews[0], null, 2))
    }

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          receiver: {
            name: r.User_Review_receiverIdToUser?.name,
            talentProfile: {
              category: r.User_Review_receiverIdToUser?.TalentProfile?.category
            }
          },
          booking: {
            event: {
              title: r.Booking?.Event?.title
            }
          }
        })),
        pendingReviews: pendingReviews.map((pr: any) => ({
          id: pr.id,
          event: {
            title: pr.Event?.title
          },
          talent: {
            name: pr.User_Booking_talentIdToUser?.name,
            talentProfile: {
              category: pr.User_Booking_talentIdToUser?.TalentProfile?.category
            }
          },
          updatedAt: pr.updatedAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/organizer/reviews:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reviews',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Only organizers can leave reviews' }, { status: 401 })
    }

    const { bookingId, rating, comment } = await request.json()

    // Validate input
    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid booking ID and rating (1-5) are required' },
        { status: 400 }
      )
    }

    // Get bookings that can be reviewed (completed, no review from this organizer)
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        organizerId: session.user.id,
        status: BookingStatus.COMPLETED,
        Review: {
          none: {}
        }
      },
      include: {
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Event: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found, not completed, or already reviewed' },
        { status: 404 }
      )
    }

    // Check if organizer already left a review for this booking
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId,
        giverId: session.user.id
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this booking' },
        { status: 400 }
      )
    }

    // Get booking details
    const bookingDetails = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        User_Booking_talentIdToUser: true,
        Event: true
      }
    })

    if (!bookingDetails) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        giverId: session.user.id,
        receiverId: booking.talentId,
        rating: parseInt(rating),
        comment: comment || '',
        reviewerType: ReviewerType.ORGANIZER,
        isVisible: true
      },
      include: {
        User_Review_receiverIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Booking: {
          include: {
            Event: true
          }
        }
      }
    })

    // Update talent's average rating
    const talentReviews = await prisma.review.findMany({
      where: {
        receiverId: booking.talentId,
        isVisible: true
      },
      select: { rating: true }
    })

    const totalRating = talentReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0)
    const averageRating = totalRating / talentReviews.length

    await prisma.talentProfile.update({
      where: { userId: booking.talentId },
      data: {
        averageRating,
        totalReviews: talentReviews.length
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'REVIEW_CREATED',
        description: `Left review for ${bookingDetails.User_Booking_talentIdToUser.name}`,
        metadata: { reviewId: review.id, bookingId, rating }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    })

  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
