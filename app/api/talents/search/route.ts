
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit
    
    // Get the current user's session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Handle empty query - return paginated results of all active users
    let whereClause: any = {
      isActive: true,
      NOT: { id: session.user.id }, // Don't include the current user in search results
    }

    // If query is provided, add search conditions
    if (query.trim()) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        {
          TalentProfile: {
            OR: [
              { category: { contains: query, mode: 'insensitive' } },
              { skills: { hasSome: [query] } },
              { bio: { contains: query, mode: 'insensitive' } }
            ]
          }
        },
        {
          OrganizerProfile: {
            companyName: { contains: query, mode: 'insensitive' }
          }
        }
      ]
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where: whereClause })

    // Search for users with pagination
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        TalentProfile: {
          select: {
            category: true,
            bio: true,
            averageRating: true,
            location: true,
            hourlyRate: true,
            skills: true
          }
        },
        OrganizerProfile: {
          select: {
            companyName: true
          }
        },
        _count: {
          select: { 
            Review_Review_receiverIdToUser: true,
            Review_Review_giverIdToUser: true
          }
        }
      },
      orderBy: [
        { TalentProfile: { averageRating: 'desc' } },
        { name: 'asc' }
      ],
      take: limit,
      skip
    })

    // Format the response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      email: user.email,
      role: user.role,
      category: user.TalentProfile?.category,
      companyName: user.OrganizerProfile?.companyName,
      profileImage: user.image,
      bio: user.TalentProfile?.bio,
      rating: user.TalentProfile?.averageRating,
      location: user.TalentProfile?.location,
      hourlyRate: user.TalentProfile?.hourlyRate,
      skills: user.TalentProfile?.skills || [],
      reviewCount: user._count.Review_Review_receiverIdToUser,
      givenReviewCount: user._count.Review_Review_giverIdToUser
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalItems: totalUsers,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPreviousPage: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search users' },
      { status: 500 }
    )
  }
}
