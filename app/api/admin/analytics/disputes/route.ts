

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, DisputeStatus, DisputeReason } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface DisputeStatusCount {
  status: DisputeStatus
  _count: number
}

interface DisputeReasonCount {
  reason: DisputeReason
  _count: number
}

interface DisputeData {
  id: string
  bookingId: string | null
  reason: DisputeReason
  status: DisputeStatus
  createdAt: Date
  User: {
    id: string
    name: string | null
    email: string
    role: UserRole
  }
  Booking: {
    id: string
    amount: any
    Event: {
      title: string
    }
  }
}

interface ResolvedDisputeData {
  createdAt: Date
  resolvedAt: Date | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dispute counts by status
    const disputeStatusCounts = await prisma.dispute.groupBy({
      by: ['status'],
      _count: true
    })

    // Get dispute counts by reason
    const disputeReasonCounts = await prisma.dispute.groupBy({
      by: ['reason'],
      _count: true
    })

    // Get recent disputes (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentDisputes = await prisma.dispute.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        Booking: {
          select: {
            id: true,
            amount: true,
            Event: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Get urgent disputes (open for more than 2 days)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const urgentDisputes = await prisma.dispute.findMany({
      where: {
        status: {
          in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW]
        },
        createdAt: {
          lt: twoDaysAgo
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        Booking: {
          select: {
            id: true,
            amount: true,
            Event: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate average resolution time for resolved disputes
    const resolvedDisputes = await prisma.dispute.findMany({
      where: {
        status: {
          in: [
            DisputeStatus.RESOLVED_ORGANIZER_FAVOR,
            DisputeStatus.RESOLVED_TALENT_FAVOR,
            DisputeStatus.RESOLVED_PARTIAL
          ]
        },
        resolvedAt: {
          not: null
        }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      }
    })

    const averageResolutionTime = resolvedDisputes.length > 0 ?
      resolvedDisputes.reduce((sum: number, dispute: ResolvedDisputeData) => {
        const resolutionTime = dispute.resolvedAt!.getTime() - dispute.createdAt.getTime()
        return sum + resolutionTime
      }, 0) / resolvedDisputes.length / (1000 * 60 * 60 * 24) : 0 // Convert to days

    // Format status counts
    const resolvedStatuses: DisputeStatus[] = [DisputeStatus.RESOLVED_ORGANIZER_FAVOR, DisputeStatus.RESOLVED_TALENT_FAVOR, DisputeStatus.RESOLVED_PARTIAL]
    const resolvedCount = disputeStatusCounts.filter((s: DisputeStatusCount) => 
      resolvedStatuses.includes(s.status as DisputeStatus)
    ).reduce((sum: number, s: DisputeStatusCount) => sum + s._count, 0)

    const statusSummary = {
      open: disputeStatusCounts.find((s: DisputeStatusCount) => s.status === DisputeStatus.OPEN)?._count || 0,
      underReview: disputeStatusCounts.find((s: DisputeStatusCount) => s.status === DisputeStatus.UNDER_REVIEW)?._count || 0,
      resolved: resolvedCount
    }

    // Format reason counts
    const reasonSummary = Object.values(DisputeReason).reduce((acc: Record<DisputeReason, number>, reason: DisputeReason) => {
      acc[reason] = disputeReasonCounts.find((r: DisputeReasonCount) => r.reason === reason)?._count || 0
      return acc
    }, {} as Record<DisputeReason, number>)

    return NextResponse.json({ 
      success: true, 
      data: {
        statusSummary,
        reasonSummary,
        recentDisputes: recentDisputes.map((dispute: DisputeData) => ({
          id: dispute.id,
          bookingId: dispute.bookingId,
          eventTitle: dispute.Booking.Event.title,
          disputedBy: {
            id: dispute.User.id,
            name: dispute.User.name,
            email: dispute.User.email,
            role: dispute.User.role
          },
          reason: dispute.reason,
          status: dispute.status,
          amount: Number(dispute.Booking.amount),
          createdAt: dispute.createdAt,
          isUrgent: dispute.createdAt < twoDaysAgo && 
                   (dispute.status === DisputeStatus.OPEN || dispute.status === DisputeStatus.UNDER_REVIEW)
        })),
        urgentDisputes: urgentDisputes.map((dispute: DisputeData) => ({
          id: dispute.id,
          bookingId: dispute.bookingId,
          eventTitle: dispute.Booking.Event.title,
          disputedBy: {
            id: dispute.User.id,
            name: dispute.User.name,
            email: dispute.User.email,
            role: dispute.User.role
          },
          reason: dispute.reason,
          status: dispute.status,
          amount: Number(dispute.Booking.amount),
          createdAt: dispute.createdAt,
          daysOpen: Math.floor((Date.now() - dispute.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        })),
        metrics: {
          totalDisputes: disputeStatusCounts.reduce((sum: number, s: DisputeStatusCount) => sum + s._count, 0),
          activeDisputes: statusSummary.open + statusSummary.underReview,
          urgentCount: urgentDisputes.length,
          averageResolutionDays: Math.round(averageResolutionTime * 10) / 10, // Round to 1 decimal
          recentDisputeCount: recentDisputes.length,
          resolutionRate: resolvedDisputes.length > 0 ? 
            Math.round((statusSummary.resolved / (statusSummary.resolved + statusSummary.open + statusSummary.underReview)) * 100) : 100
        }
      }
    })

  } catch (error) {
    console.error('Dispute analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
