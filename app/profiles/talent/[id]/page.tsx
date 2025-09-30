
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { TalentProfileView } from './_components/talent-profile-view'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

async function getTalentProfile(id: string) {
  try {
    // Try to find talent by ID first, then by username if not found
    const talent = await prisma.talentProfile.findFirst({
      where: {
        OR: [
          { id: id },
          { username: id },
          { userId: id }
        ],
        User: {
          role: UserRole.TALENT,
          isActive: true,
          isEmailVerified: true
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            verificationStatus: true
          }
        },
        File: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        Package: {
          where: {
            isPublished: true,
            isActive: true
          },
          orderBy: [
            { bookingCount: 'desc' },
            { updatedAt: 'desc' }
          ]
        },
        BankAccount: {
          select: {
            isVerified: true
          }
        }
      }
    })

    if (!talent) {
      return null
    }

    // Increment profile views
    await prisma.talentProfile.update({
      where: { id: talent.id },
      data: { profileViews: { increment: 1 } }
    })

    // Get reviews for this talent
    const reviews = await prisma.review.findMany({
      where: {
        receiverId: talent.userId,
        isVisible: true
      },
      include: {
        User_Review_giverIdToUser: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        Booking: {
          select: {
            id: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to recent 10 reviews
    })

    // Parse social links safely
    let socialLinks = {}
    try {
      if (talent.socialLinks && typeof talent.socialLinks === 'object') {
        socialLinks = talent.socialLinks as Record<string, string>
      }
    } catch (error) {
      console.error('Error parsing social links:', error)
    }

    // Transform the data for public consumption
    return {
      id: talent.id,
      userId: talent.userId,
      username: talent.username,
      name: talent.User?.name || 'Professional Talent',
      bio: talent.bio,
      tagline: talent.tagline,
      location: talent.location,
      website: talent.website,
      category: talent.category,
      skills: talent.skills || [],
      experience: talent.experience,
      hourlyRate: talent.hourlyRate ? parseFloat(talent.hourlyRate.toString()) : null,
      availability: talent.availability,
      averageRating: talent.averageRating ? parseFloat(talent.averageRating.toString()) : 0,
      totalReviews: talent.totalReviews || 0,
      totalBookings: talent.totalBookings || 0,
      profileViews: talent.profileViews || 0,
      socialLinks,
      epkUrl: talent.epkUrl,
      pastClients: talent.pastClients || [],
      verified: talent.mpesaVerified || talent.BankAccount?.isVerified || false,
      memberSince: talent.User?.createdAt?.toISOString(),
      image: talent.User?.image,
      portfolioItems: talent.File?.map(item => ({
        id: item.id,
        filename: item.filename,
        originalName: item.originalName,
        mimeType: item.mimeType,
        url: item.url,
        createdAt: item.createdAt.toISOString()
      })) || [],
      packages: talent.Package?.map(pkg => ({
        id: pkg.id,
        title: pkg.title,
        description: pkg.description,
        category: pkg.category,
        location: pkg.location,
        price: parseFloat(pkg.price.toString()),
        priceIsHidden: pkg.priceIsHidden,
        duration: pkg.duration,
        features: pkg.features || [],
        coverImageUrl: pkg.coverImageUrl,
        images: pkg.images || [],
        viewCount: pkg.viewCount,
        inquiryCount: pkg.inquiryCount,
        bookingCount: pkg.bookingCount,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString()
      })) || [],
      reviews: reviews?.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewerType: review.reviewerType,
        createdAt: review.createdAt.toISOString(),
        reviewer: {
          name: review.User_Review_giverIdToUser?.name || 'Anonymous',
          image: review.User_Review_giverIdToUser?.image
        },
        booking: {
          id: review.Booking?.id || '',
          date: review.Booking?.createdAt.toISOString() || ''
        }
      })) || []
    }
  } catch (error) {
    console.error('Error fetching talent profile:', error)
    return null
  }
}

export default async function TalentProfilePage({ params }: PageProps) {
  const profile = await getTalentProfile(params.id)
  
  if (!profile) {
    notFound()
  }

  return <TalentProfileView profile={profile} />
}

export async function generateMetadata({ params }: PageProps) {
  const profile = await getTalentProfile(params.id)
  
  if (!profile) {
    return {
      title: 'Talent Not Found',
      description: 'The requested talent profile could not be found.'
    }
  }

  return {
    title: `${profile.name} - ${profile.category || 'Professional Talent'} | GigSecure`,
    description: profile.tagline || profile.bio || `Professional ${profile.category || 'talent'} based in ${profile.location || 'Kenya'}.`,
    openGraph: {
      title: `${profile.name} - ${profile.category || 'Professional Talent'}`,
      description: profile.tagline || profile.bio || `Professional ${profile.category || 'talent'} based in ${profile.location || 'Kenya'}.`,
      images: profile.image ? [{ url: profile.image }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name} - ${profile.category || 'Professional Talent'}`,
      description: profile.tagline || profile.bio || `Professional ${profile.category || 'talent'} based in ${profile.location || 'Kenya'}.`,
      images: profile.image ? [profile.image] : [],
    }
  }
}
