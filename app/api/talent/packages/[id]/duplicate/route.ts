
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

// POST /api/talent/packages/[id]/duplicate - Duplicate a package
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only talents can duplicate packages.' },
        { status: 401 }
      )
    }

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

    // Find the original package
    const originalPackage = await prisma.package.findFirst({
      where: {
        id: params.id,
        talentId: talentProfile.id,
        isActive: true
      }
    })

    if (!originalPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found or you do not have permission to duplicate it' },
        { status: 404 }
      )
    }

    // Create the duplicate package
    const duplicatedPackage = await prisma.package.create({
      data: {
        talentId: talentProfile.id,
        title: `${originalPackage.title} (Copy)`,
        description: originalPackage.description,
        category: originalPackage.category,
        location: originalPackage.location,
        price: originalPackage.price,
        duration: originalPackage.duration,
        features: originalPackage.features,
        coverImageUrl: originalPackage.coverImageUrl,
        images: originalPackage.images,
        isPublished: false, // Set as draft by default so talent can edit before publishing
        priceIsHidden: originalPackage.priceIsHidden,
        // Reset analytics for the new package
        viewCount: 0,
        inquiryCount: 0,
        bookingCount: 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...duplicatedPackage,
        price: parseFloat(duplicatedPackage.price.toString())
      },
      message: 'Package duplicated successfully'
    })

  } catch (error) {
    console.error('Error duplicating package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate package' },
      { status: 500 }
    )
  }
}
