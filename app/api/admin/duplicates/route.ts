
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { findExistingDuplicates, getDuplicateStats } from '@/lib/duplicate-detection'
import { getPendingMerges } from '@/lib/account-merge'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'stats':
        const stats = await getDuplicateStats()
        return NextResponse.json({ stats })

      case 'pending':
        const pendingMerges = await getPendingMerges()
        return NextResponse.json({ pendingMerges })

      case 'scan':
        const duplicates = await findExistingDuplicates()
        return NextResponse.json({ duplicates })

      default:
        // List all duplicate detection logs
        const { prisma } = await import('@/lib/db')
        const logs = await prisma.duplicateDetectionLog.findMany({
          where: {
            resolved: false
          },
          orderBy: {
            similarityScore: 'desc'
          },
          take: 50
        })
        return NextResponse.json({ logs })
    }

  } catch (error) {
    console.error('Error in duplicates API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
