
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { withValidation, withSecurity } from '@/lib/security/middleware'
import { userInputSchemas, querySchemas, validateInput } from '@/lib/security/validation'
import { sanitizeUserInput, sanitizeSearchQuery } from '@/lib/security/sanitization'

export const dynamic = 'force-dynamic'

// GET /api/talent/packages - Get all packages for the authenticated talent
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only talents can access this endpoint.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const published = searchParams.get('published')
    const search = searchParams.get('search') || ''

    // Get talent profile
    const talentProfile = await prisma.talentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!talentProfile) {
      return NextResponse.json(
        { success: false, error: 'Talent profile not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const whereClause: any = {
      talentId: talentProfile.id,
      isActive: true
    }

    // Add published filter
    if (published === 'true') {
      whereClause.isPublished = true
    } else if (published === 'false') {
      whereClause.isPublished = false
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get packages with pagination
    const [packages, totalCount] = await Promise.all([
      prisma.package.findMany({
        where: whereClause,
        orderBy: [
          { isPublished: 'desc' },
          { updatedAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.package.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        packages: packages.map(pkg => ({
          ...pkg,
          price: parseFloat(pkg.price.toString()),
          viewCount: pkg.viewCount,
          inquiryCount: pkg.inquiryCount,
          bookingCount: pkg.bookingCount
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }
    })

  } catch (error) {
    console.error('Error fetching talent packages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

// POST /api/talent/packages - Create a new package
const postHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only talents can create packages.' },
        { status: 401 }
      )
    }

    let packageData;
    try {
      packageData = await request.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON data' },
        { status: 400 }
      )
    }

    // Validate and sanitize package data
    try {
      packageData = validateInput(userInputSchemas.package, packageData);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Sanitize all string inputs
    packageData = sanitizeUserInput(packageData);

    const {
      title,
      description,
      category,
      location,
      price,
      duration,
      features,
      coverImageUrl,
      images,
      priceIsHidden
    } = packageData

    // Get talent profile
    const talentProfile = await prisma.talentProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!talentProfile) {
      return NextResponse.json(
        { success: false, error: 'Talent profile not found' },
        { status: 404 }
      )
    }

    // Create the package
    const newPackage = await prisma.package.create({
      data: {
        talentId: talentProfile.id,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location?.trim() || null,
        price: parseFloat(price.toString()),
        duration: duration?.trim() || null,
        features: Array.isArray(features) ? features.filter(f => f.trim()) : [],
        coverImageUrl: coverImageUrl || null,
        images: Array.isArray(images) ? images.filter(img => img.trim()) : [],
        isPublished: true, // NEW PACKAGES ARE PUBLISHED BY DEFAULT
        priceIsHidden: Boolean(priceIsHidden) || false
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...newPackage,
        price: parseFloat(newPackage.price.toString())
      },
      message: 'Package created successfully'
    })

  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create package' },
      { status: 500 }
    )
  }
}

export const POST = withValidation(userInputSchemas.package)(postHandler);
