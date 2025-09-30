
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET /api/talent/packages/[id] - Get a specific package
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only talents can access this endpoint.' },
        { status: 401 }
      )
    }

    const packageId = params.id

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

    // Get the specific package
    const packageData = await prisma.package.findFirst({
      where: {
        id: packageId,
        talentId: talentProfile.id,
        isActive: true
      }
    })

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...packageData,
        price: parseFloat(packageData.price.toString())
      }
    })

  } catch (error) {
    console.error('Error fetching package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch package' },
      { status: 500 }
    )
  }
}

// PUT /api/talent/packages/[id] - Update a specific package
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only talents can update packages.' },
        { status: 401 }
      )
    }

    const packageId = params.id
    const body = await request.json()
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
      isPublished,
      priceIsHidden
    } = body

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

    // Check if package exists and belongs to talent
    const existingPackage = await prisma.package.findFirst({
      where: {
        id: packageId,
        talentId: talentProfile.id,
        isActive: true
      }
    })

    if (!existingPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (category !== undefined) updateData.category = category.trim()
    if (location !== undefined) updateData.location = location?.trim() || null
    if (price !== undefined) updateData.price = parseFloat(price.toString())
    if (duration !== undefined) updateData.duration = duration?.trim() || null
    if (features !== undefined) updateData.features = Array.isArray(features) ? features.filter(f => f.trim()) : []
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl || null
    if (images !== undefined) updateData.images = Array.isArray(images) ? images.filter(img => img.trim()) : []
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished)
    if (priceIsHidden !== undefined) updateData.priceIsHidden = Boolean(priceIsHidden)

    // Update the package
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedPackage,
        price: parseFloat(updatedPackage.price.toString())
      },
      message: 'Package updated successfully'
    })

  } catch (error) {
    console.error('Error updating package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    )
  }
}

// DELETE /api/talent/packages/[id] - Delete a specific package (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only talents can delete packages.' },
        { status: 401 }
      )
    }

    const packageId = params.id

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

    // Check if package exists and belongs to talent
    const existingPackage = await prisma.package.findFirst({
      where: {
        id: packageId,
        talentId: talentProfile.id,
        isActive: true
      }
    })

    if (!existingPackage) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      )
    }

    // Soft delete the package
    await prisma.package.update({
      where: { id: packageId },
      data: { 
        isActive: false,
        isPublished: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete package' },
      { status: 500 }
    )
  }
}
