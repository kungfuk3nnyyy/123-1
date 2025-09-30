
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/packages/[id]/view - Track package view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get client IP for basic deduplication (optional enhancement for future)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    
    // For now, we'll just increment the view count
    // Future enhancement: implement more sophisticated view tracking with IP/session deduplication
    
    const updatedPackage = await prisma.package.update({
      where: {
        id: params.id,
        isActive: true,
        isPublished: true // Only track views for published packages
      },
      data: {
        viewCount: {
          increment: 1
        }
      },
      select: {
        id: true,
        viewCount: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        packageId: updatedPackage.id,
        viewCount: updatedPackage.viewCount
      }
    })

  } catch (error) {
    console.error('Error tracking package view:', error)
    
    // Don't return error to client - view tracking should be silent
    // Return success even if tracking fails to avoid breaking user experience
    return NextResponse.json({
      success: true,
      message: 'View tracking processed'
    })
  }
}
