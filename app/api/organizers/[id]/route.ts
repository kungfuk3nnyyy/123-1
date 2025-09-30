
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole, EventStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET /api/organizers/[id] - Get organizer profile by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Find organizer by ID
    const organizer = await prisma.user.findUnique({
      where: { 
        id: id,
        role: UserRole.ORGANIZER,
        isActive: true,
        isEmailVerified: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        companyName: true,
        websiteUrl: true,
        publicBio: true,
        profilePictureUrl: true,
        verificationStatus: true,
        createdAt: true,
        OrganizerProfile: {
          select: {
            companyName: true,
            bio: true,
            website: true,
            phoneNumber: true,
            location: true,
            eventTypes: true,
            totalEvents: true,
            averageRating: true
          }
        }
      }
    })

    if (!organizer) {
      return NextResponse.json({ error: 'Organizer not found' }, { status: 404 })
    }

    // Get organizer's open/active events
    const events = await prisma.event.findMany({
      where: {
        organizerId: id,
        status: {
          in: [EventStatus.PUBLISHED, EventStatus.IN_PROGRESS]
        },
        isActive: true,
        isPublic: true,
        eventDate: {
          gte: new Date() // Only future events
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
        eventDate: true,
        duration: true,
        requirements: true,
        budget: true,
        budgetMin: true,
        budgetMax: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            Proposal: true
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      },
      take: 20 // Limit to 20 events
    })

    // Get recent reviews for this organizer
    const reviews = await prisma.review.findMany({
      where: { 
        receiverId: id,
        isVisible: true
      },
      include: {
        User_Review_giverIdToUser: {
          select: {
            name: true,
            image: true,
            TalentProfile: {
              select: {
                category: true,
                username: true
              }
            }
          }
        },
        Booking: {
          select: {
            Event: {
              select: {
                title: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Calculate stats
    const totalEvents = await prisma.event.count({
      where: {
        organizerId: id,
        status: {
          not: EventStatus.DRAFT
        }
      }
    })

    const completedEvents = await prisma.event.count({
      where: {
        organizerId: id,
        status: EventStatus.COMPLETED
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        organizer: {
          ...organizer,
          totalEvents,
          completedEvents,
          // Use new fields first, fallback to OrganizerProfile
          displayName: organizer.companyName || organizer.OrganizerProfile?.companyName || organizer.name,
          bio: organizer.publicBio || organizer.OrganizerProfile?.bio,
          website: organizer.websiteUrl || organizer.OrganizerProfile?.website,
          profileImage: organizer.profilePictureUrl || organizer.image,
          location: organizer.OrganizerProfile?.location,
          eventTypes: organizer.OrganizerProfile?.eventTypes || [],
          averageRating: organizer.OrganizerProfile?.averageRating ? parseFloat(organizer.OrganizerProfile.averageRating.toString()) : 0
        },
        events: events.map(event => ({
          ...event,
          budget: event.budget ? parseFloat(event.budget.toString()) : null,
          budgetMin: event.budgetMin ? parseFloat(event.budgetMin.toString()) : null,
          budgetMax: event.budgetMax ? parseFloat(event.budgetMax.toString()) : null,
          proposalCount: event._count.Proposal
        })),
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          reviewerType: review.reviewerType,
          createdAt: review.createdAt.toISOString(),
          reviewer: {
            name: review.User_Review_giverIdToUser?.name || 'Anonymous',
            image: review.User_Review_giverIdToUser?.image,
            category: review.User_Review_giverIdToUser?.TalentProfile?.category,
            username: review.User_Review_giverIdToUser?.TalentProfile?.username
          },
          event: {
            title: review.Booking?.Event?.title || 'Event',
            category: review.Booking?.Event?.category || []
          }
        }))
      }
    })
  } catch (error) {
    console.error('Get organizer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
