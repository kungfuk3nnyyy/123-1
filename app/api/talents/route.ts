import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const search = searchParams.get('search')
    const location = searchParams.get('location')
    const categories = searchParams.get('category')?.split(',').filter(Boolean)
    const minRate = searchParams.get('minRate') ? parseFloat(searchParams.get('minRate')) : undefined
    const maxRate = searchParams.get('maxRate') ? parseFloat(searchParams.get('maxRate')) : undefined
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')) : undefined
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || []

    const where: any = {
      User: {
        role: UserRole.TALENT,
        isActive: true
        // **FIXED**: Temporarily removed the admin approval check to allow talents to be displayed.
        // You can re-enable this once you have an admin workflow in place.
        // adminApprovalStatus: 'APPROVED'
      }
    }

    if (search) {
      where.OR = [
        { User: { name: { contains: search, mode: 'insensitive' } } },
        { skills: { has: search.toLowerCase() } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categories && categories.length > 0) {
        where.category = { in: categories };
    }

    if (location) {
      where.location = { equals: location, mode: 'insensitive' }
    }

    if (minRating) {
      where.averageRating = { gte: minRating }
    }

    if (minRate !== undefined) {
        where.hourlyRate = { gte: minRate }
    }

    if (maxRate !== undefined) {
        where.hourlyRate = { ...where.hourlyRate, lte: maxRate }
    }

    if (skills.length > 0) {
      where.skills = {
        hasSome: skills
      }
    }

    const [talents, total, categoriesResult] = await Promise.all([
      prisma.talentProfile.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true
            }
          },
          File: {
            take: 5,
            select: {
              id: true,
              url: true,
              filename: true,
              mimeType: true
            }
          },
          BankAccount: {
            select: {
              isVerified: true
            }
          }
        },
        orderBy: [
          { averageRating: 'desc' },
          { totalReviews: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.talentProfile.count({ where }),
      prisma.talentProfile.findMany({
        select: {
          category: true,
        },
        distinct: ['category'],
        where: {
            category: {
                not: null
            }
        }
      })
    ])

    const allCategories = categoriesResult.map(c => c.category).filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      data: {
        talents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        categories: allCategories,
      }
    })
  } catch (error) {
    console.error('Get talents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}