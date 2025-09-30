

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface PackageData {
  id: string
  title: string
  description: string
  category: string
  location: string | null
  price: any
  priceIsHidden: boolean
  duration: string | null
  features: string[]
  coverImageUrl: string | null
  images: string[]
  TalentProfile: {
    averageRating: any | null
    totalBookings: number
    mpesaVerified: boolean
    location: string | null
    User: {
      id: string
      name: string | null
      email: string
    }
    BankAccount: {
      isVerified: boolean
    } | null
  }
}

export async function GET() {
  try {
    // Get featured packages with more lenient conditions
    const packages = await prisma.package.findMany({
      where: {
        isPublished: true,
        isActive: true,
        TalentProfile: {
          User: {
            role: UserRole.TALENT,
            isActive: true
          }
        },
        // Remove the strict verification and rating requirements
        // to ensure we return some packages
        OR: [
          {
            TalentProfile: {
              averageRating: { gte: 3.5 } // Lower the rating threshold
            }
          },
          {
            bookingCount: { gt: 0 } // Include packages with at least one booking
          },
          {
            viewCount: { gt: 0 } // Include packages that have been viewed
          }
        ]
      },
      include: {
        TalentProfile: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                verificationStatus: true
              }
            },
            BankAccount: true
          }
        }
      },
      orderBy: [
        { TalentProfile: { averageRating: 'desc' } },
        { TalentProfile: { totalBookings: 'desc' } },
        { updatedAt: 'desc' }
      ],
      take: 4
    })

    // Format packages for frontend
    const formattedPackages = packages.map((pkg: PackageData) => ({
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
      rating: parseFloat(pkg.TalentProfile.averageRating?.toString() || '0'),
      reviews: pkg.TalentProfile.totalBookings || 0,
      provider: {
        id: pkg.TalentProfile.User.id,
        name: pkg.TalentProfile.User.name || 'Professional Talent',
        location: pkg.location || pkg.TalentProfile.location || 'Nairobi',
        verified: pkg.TalentProfile.User.verificationStatus === VerificationStatus.VERIFIED
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedPackages
    })

  } catch (error) {
    console.error('Error fetching featured packages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured packages' },
      { status: 500 }
    )
  }
}
