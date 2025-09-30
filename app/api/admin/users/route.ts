
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'

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
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {}

    if (role && role !== 'ALL') {
      where.role = role as UserRole
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'suspended') {
      where.isActive = false
    }

    if (verified === 'verified') {
      where.verificationStatus = VerificationStatus.VERIFIED
    } else if (verified === 'pending') {
      where.verificationStatus = VerificationStatus.PENDING
    } else if (verified === 'rejected') {
      where.verificationStatus = VerificationStatus.REJECTED
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        TalentProfile: {
          select: {
            category: true,
            totalBookings: true,
          },
        },
        OrganizerProfile: {
          select: {
            companyName: true,
            totalEvents: true,
          },
        },
        Booking_Booking_organizerIdToUser: {
          select: {
            id: true,
          },
        },
        Booking_Booking_talentIdToUser: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    const totalUsers = await prisma.user.count({ where })

    // Format users data
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      email: user.email,
      role: user.role,
      status: user.isActive ? 'active' : 'suspended',
      joinDate: user.createdAt.toLocaleDateString(),
      totalBookings: (user.Booking_Booking_organizerIdToUser?.length || 0) + (user.Booking_Booking_talentIdToUser?.length || 0),
      category: user.TalentProfile?.category || user.OrganizerProfile?.companyName || 'N/A',
      verified: user.verificationStatus === VerificationStatus.VERIFIED,
      verificationStatus: user.verificationStatus,
      adminApprovalStatus: user.adminApprovalStatus,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      emailVerificationToken: user.emailVerificationToken,
      createdAt: user.createdAt.toISOString(),
    }))

    // Stats calculations
    const totalUsersCount = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { isActive: true } })
    const suspendedUsers = await prisma.user.count({ where: { isActive: false } })
    const talentsCount = await prisma.user.count({ where: { role: 'TALENT' } })
    const organizersCount = await prisma.user.count({ where: { role: 'ORGANIZER' } })
    const pendingAdmins = await prisma.user.count({ where: { role: 'ADMIN', adminApprovalStatus: 'PENDING' } })
    const approvedAdmins = await prisma.user.count({ where: { role: 'ADMIN', adminApprovalStatus: 'APPROVED' } })
    const rejectedAdmins = await prisma.user.count({ where: { role: 'ADMIN', adminApprovalStatus: 'REJECTED' } })

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page: page,
        limit: limit,
        pages: Math.ceil(totalUsers / limit),
      },
      stats: {
        totalUsers: totalUsersCount,
        activeUsers,
        suspendedUsers,
        talentsCount,
        organizersCount,
        pendingAdmins,
        approvedAdmins,
        rejectedAdmins,
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
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

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isActive: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let actionDescription = ''

    switch (action) {
      case 'activate':
        updateData = { isActive: true }
        actionDescription = 'Activated user account'
        break
      case 'suspend':
        updateData = { isActive: false }
        actionDescription = 'Suspended user account'
        break
      case 'verify':
        updateData = { 
          verificationStatus: VerificationStatus.VERIFIED,
          isEmailVerified: true
        }
        actionDescription = 'Manually verified user'
        break
      case 'unverify':
        updateData = { verificationStatus: VerificationStatus.UNVERIFIED }
        actionDescription = 'Removed user verification'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Log admin activity
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        adminEmail: session.user.email || 'admin@example.com',
        action: `user_${action}`,
        details: `${actionDescription}: ${user.name || user.email}`,
        targetUserId: userId,
        targetUserEmail: user.email,
      }
    })

    return NextResponse.json({
      success: true,
      message: `User ${action}d successfully`,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
