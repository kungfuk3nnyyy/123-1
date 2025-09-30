
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const skip = (page - 1) * limit

    // Build filter conditions
    const whereClause: any = {
      isPublished: true,
      isActive: true,
      TalentProfile: {
        User: {
          role: UserRole.TALENT,
          isActive: true,
          isEmailVerified: true
        }
      }
    }

    if (category && category !== 'all' && category !== 'ALL') {
      whereClause.category = { contains: category, mode: 'insensitive' }
    }

    if (location && location !== 'all' && location !== 'ALL') {
      whereClause.OR = [
        { location: { contains: location, mode: 'insensitive' } },
        { TalentProfile: { location: { contains: location, mode: 'insensitive' } } }
      ]
    }

    if (search) {
      whereClause.OR = whereClause.OR || []
      whereClause.OR.push(
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { TalentProfile: { User: { name: { contains: search, mode: 'insensitive' } } } }
      )
    }

    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice) whereClause.price.gte = parseFloat(minPrice)
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice)
    }

    const packages = await prisma.package.findMany({
      where: whereClause,
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
        { updatedAt: 'desc' }
      ],
      take: limit,
      skip
    })

    const totalPackages = await prisma.package.count({ where: whereClause })

    // Format packages for frontend
    const formattedPackages = packages.map((pkg: any) => ({
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
        verified: pkg.TalentProfile.User.verificationStatus === VerificationStatus.VERIFIED,
        skills: pkg.TalentProfile.skills || [],
        bio: pkg.TalentProfile.bio || ''
      }
    }))

    return NextResponse.json({
      success: true,
      packages: formattedPackages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPackages / limit),
        totalItems: totalPackages,
        itemsPerPage: limit
      }
    })

  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
