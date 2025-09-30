
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET /api/talents/[id] - Get talent profile by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const talent = await prisma.talentProfile.findUnique({
      where: { userId: id },
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
          select: {
            id: true,
            url: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true
          }
        },
        BankAccount: {
          select: {
            isVerified: true
          }
        }
      }
    })

    if (!talent) {
      return NextResponse.json({ error: 'Talent not found' }, { status: 404 })
    }

    // Get recent reviews
    const reviews = await prisma.review.findMany({
      where: { receiverId: id },
      include: {
        User_Review_giverIdToUser: {
          select: {
            name: true,
            OrganizerProfile: {
              select: {
                companyName: true
              }
            }
          }
        },
        Booking: {
          select: {
            Event: {
              select: {
                title: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      data: {
        talent,
        reviews
      }
    })
  } catch (error) {
    console.error('Get talent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
