
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { UserRole, EventStatus, VerificationStatus } from '@prisma/client'
import { OrganizerProfileView } from './_components/organizer-profile-view'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

interface EventItem {
  id: string
  title: string
  description: string
  category: string[]
  location: string
  eventDate: Date
  duration: number | null
  requirements: string | null
  budget: any
  budgetMin: any
  budgetMax: any
  status: any
  createdAt: Date
  _count: {
    Proposal: number
  }
}

interface ReviewItem {
  id: string
  rating: number
  comment: string
  reviewerType: any
  createdAt: Date
  User_Review_giverIdToUser: {
    name: string | null
    image: string | null
    TalentProfile: {
      category: string | null
      username: string | null
    } | null
  }
  Booking: {
    Event: {
      title: string
      category: string[]
    }
  }
}

async function getOrganizerProfile(id: string) {
  try {
    const organizer = await prisma.user.findUnique({
      where: {
        id: id,
        role: UserRole.ORGANIZER,
        isActive: true,
        isEmailVerified: true
      },
      include: {
        OrganizerProfile: true
      }
    })

    if (!organizer) {
      return null
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
          gte: new Date()
        }
      },
      include: {
        _count: {
          select: {
            Proposal: true
          }
        }
      },
      orderBy: {
        eventDate: 'asc'
      },
      take: 20
    })

    // Get reviews for this organizer
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
      orderBy: {
        createdAt: 'desc'
      },
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

    // Transform the data for public consumption
    return {
      id: organizer.id,
      name: organizer.name,
      email: organizer.email,
      displayName: organizer.companyName || organizer.OrganizerProfile?.companyName || organizer.name,
      bio: organizer.publicBio || organizer.OrganizerProfile?.bio,
      website: organizer.websiteUrl || organizer.OrganizerProfile?.website,
      profileImage: organizer.profilePictureUrl || organizer.image,
      location: organizer.OrganizerProfile?.location,
      eventTypes: organizer.OrganizerProfile?.eventTypes || [],
      verified: organizer.verificationStatus === VerificationStatus.VERIFIED,
      memberSince: organizer.createdAt.toISOString(),
      totalEvents,
      completedEvents,
      averageRating: organizer.OrganizerProfile?.averageRating ? parseFloat(organizer.OrganizerProfile.averageRating.toString()) : 0,
      totalReviews: reviews.length,
      events: events.map((event: EventItem) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        location: event.location,
        eventDate: event.eventDate.toISOString(),
        duration: event.duration,
        requirements: event.requirements,
        budget: event.budget ? parseFloat(event.budget.toString()) : null,
        budgetMin: event.budgetMin ? parseFloat(event.budgetMin.toString()) : null,
        budgetMax: event.budgetMax ? parseFloat(event.budgetMax.toString()) : null,
        status: event.status,
        createdAt: event.createdAt.toISOString(),
        proposalCount: event._count.Proposal
      })),
      reviews: reviews.map((review: ReviewItem) => ({
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
  } catch (error) {
    console.error('Error fetching organizer profile:', error)
    return null
  }
}

export default async function OrganizerProfilePage({ params }: PageProps) {
  const profile = await getOrganizerProfile(params.id)
  
  if (!profile) {
    notFound()
  }

  return <OrganizerProfileView profile={profile} />
}

export async function generateMetadata({ params }: PageProps) {
  const profile = await getOrganizerProfile(params.id)
  
  if (!profile) {
    return {
      title: 'Organizer Not Found',
      description: 'The requested organizer profile could not be found.'
    }
  }

  return {
    title: `${profile.displayName} - Event Organizer | GigSecure`,
    description: profile.bio || `Professional event organizer ${profile.location ? `based in ${profile.location}` : 'in Kenya'}. ${profile.totalEvents} events organized.`,
    openGraph: {
      title: `${profile.displayName} - Event Organizer`,
      description: profile.bio || `Professional event organizer ${profile.location ? `based in ${profile.location}` : 'in Kenya'}. ${profile.totalEvents} events organized.`,
      images: profile.profileImage ? [{ url: profile.profileImage }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.displayName} - Event Organizer`,
      description: profile.bio || `Professional event organizer ${profile.location ? `based in ${profile.location}` : 'in Kenya'}. ${profile.totalEvents} events organized.`,
      images: profile.profileImage ? [profile.profileImage] : [],
    }
  }
}
