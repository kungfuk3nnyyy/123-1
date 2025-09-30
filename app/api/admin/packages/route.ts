
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    const talent = searchParams.get('talent')
    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {}

    if (category && category !== 'ALL') {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (location && location !== 'ALL') {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (status === 'published') {
      where.isPublished = true
      where.isActive = true
    } else if (status === 'draft') {
      where.isPublished = false
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (talent) {
      where.TalentProfile = {
        User: {
          name: { contains: talent, mode: 'insensitive' }
        }
      }
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        TalentProfile: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    const totalPackages = await prisma.package.count({ where })

    // Format packages data
    const formattedPackages = packages.map((pkg: any) => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      category: pkg.category,
      location: pkg.location,
      price: Number(pkg.price),
      priceIsHidden: pkg.priceIsHidden,
      duration: pkg.duration,
      features: pkg.features,
      coverImageUrl: pkg.coverImageUrl,
      images: pkg.images,
      isPublished: pkg.isPublished,
      isActive: pkg.isActive,
      viewCount: pkg.viewCount,
      inquiryCount: pkg.inquiryCount,
      bookingCount: pkg.bookingCount,
      createdAt: pkg.createdAt.toISOString(),
      talent: {
        id: pkg.TalentProfile.User.id,
        name: pkg.TalentProfile.User.name || 'Unnamed User',
        email: pkg.TalentProfile.User.email,
        verificationStatus: pkg.TalentProfile.User.verificationStatus,
        category: pkg.TalentProfile.category
      }
    }))

    // Stats calculations
    const totalPackagesCount = await prisma.package.count()
    const publishedPackages = await prisma.package.count({ where: { isPublished: true, isActive: true } })
    const unpublishedPackages = await prisma.package.count({ where: { isPublished: false, isActive: true } })
    const inactivePackages = await prisma.package.count({ where: { isActive: false } })
    const categoryCountsResult = await prisma.package.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    })
    const categoryCounts = categoryCountsResult.reduce((acc: Record<string, number>, curr: { category: string; _count: { category: number } }) => {
      acc[curr.category] = curr._count.category
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      packages: formattedPackages,
      pagination: {
        total: totalPackages,
        page: page,
        limit: limit,
        pages: Math.ceil(totalPackages / limit),
      },
      stats: {
        totalPackages: totalPackagesCount,
        publishedPackages,
        unpublishedPackages,
        inactivePackages,
        categoryCounts,
      },
    })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId, action } = await request.json()

    if (!packageId || !action) {
      return NextResponse.json(
        { error: 'Package ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'publish':
        updateData = { isPublished: true, isActive: true }
        break
      case 'unpublish':
        updateData = { isPublished: false }
        break
      case 'activate':
        updateData = { isActive: true }
        break
      case 'deactivate':
        updateData = { isActive: false, isPublished: false }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        TalentProfile: {
          include: {
            User: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: updateData,
    })

    // Log admin activity (without metadata since it doesn't exist in schema)
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        adminEmail: session.user.email || 'admin@example.com',
        action: `package_${action}`,
        details: `${action.charAt(0).toUpperCase() + action.slice(1)} package: ${pkg.title} for talent ${pkg.TalentProfile.User.email}`,
        targetUserId: pkg.TalentProfile.User.id,
        targetUserEmail: pkg.TalentProfile.User.email,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Package ${action}d successfully`,
      data: updatedPackage,
    })
  } catch (error) {
    console.error('Error updating package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    )
  }
}
