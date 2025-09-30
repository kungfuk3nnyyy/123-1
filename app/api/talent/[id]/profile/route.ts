
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Find talent by ID, username, or userId
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
          orderBy: { createdAt: 'desc' }
        },
        Package: {
          where: {
            isPublished: true,
            isActive: true
          },
          orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' }
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
      return NextResponse.json(
        { error: 'Talent profile not found' },
        { status: 404 }
      )
    }

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
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Increment profile view count
    await prisma.talentProfile.update({
      where: { id: talent.id },
      data: { profileViews: { increment: 1 } }
    })

    // Format talent profile for public viewing
    const profile = {
      id: talent.id,
      userId: talent.userId,
      username: talent.username,
      name: talent.User?.name || 'Professional Talent',
      bio: talent.bio,
      tagline: talent.tagline,
      location: talent.location,
      website: talent.website,
      phoneNumber: talent.phoneNumber, // This will be hidden on frontend for privacy
      category: talent.category,
      skills: talent.skills || [],
      experience: talent.experience,
      hourlyRate: talent.hourlyRate ? Number(talent.hourlyRate) : null,
      availability: talent.availability,
      averageRating: talent.averageRating ? Number(talent.averageRating) : 0,
      totalReviews: talent.totalReviews || 0,
      totalBookings: talent.totalBookings || 0,
      profileViews: talent.profileViews || 0,
      socialLinks: talent.socialLinks || {},
      epkUrl: talent.epkUrl,
      pastClients: talent.pastClients || [],
      verified: talent.User?.verificationStatus === VerificationStatus.VERIFIED,
      memberSince: talent.User?.createdAt,
      image: talent.User?.image,
      portfolioItems: talent.File?.map((item: any) => ({
        id: item.id,
        filename: item.filename,
        originalName: item.originalName,
        url: item.url,
        mimeType: item.mimeType,
        size: item.size,
        createdAt: item.createdAt
      })) || [],
      packages: talent.Package?.map((pkg: any) => ({
        id: pkg.id,
        title: pkg.title,
        description: pkg.description,
        category: pkg.category,
        location: pkg.location,
        price: Number(pkg.price),
        priceIsHidden: pkg.priceIsHidden,
        duration: pkg.duration,
        features: pkg.features || [],
        coverImageUrl: pkg.coverImageUrl,
        images: pkg.images || [],
        viewCount: pkg.viewCount,
        inquiryCount: pkg.inquiryCount,
        bookingCount: pkg.bookingCount,
        isPublished: pkg.isPublished,
        updatedAt: pkg.updatedAt,
        createdAt: pkg.createdAt
      })) || [],
      reviews: reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: {
          name: review.User_Review_giverIdToUser?.name || 'Anonymous',
          image: review.User_Review_giverIdToUser?.image
        },
        booking: {
          id: review.Booking?.id,
          date: review.Booking?.createdAt
        }
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    console.error('Error fetching talent profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch talent profile' },
      { status: 500 }
    )
  }
}
