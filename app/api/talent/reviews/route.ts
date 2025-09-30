

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get reviews for this talent
    const reviews = await prisma.review.findMany({
      where: {
        receiverId: session.user.id,
        isVisible: true
      },
      include: {
        giver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        Booking: {
          include: {
            Event: {
              select: {
                title: true,
                eventDate: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.review.count({
      where: {
        receiverId: session.user.id,
        isVisible: true
      }
    })

    // Calculate average rating
    const ratingStats = await prisma.review.aggregate({
      where: {
        receiverId: session.user.id,
        isVisible: true
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: (offset + limit) < totalCount
        },
        stats: {
          averageRating: ratingStats._avg.rating ? Number(ratingStats._avg.rating.toFixed(1)) : 0,
          totalReviews: ratingStats._count.id
        }
      }
    })

  } catch (error) {
    console.error('Talent reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
