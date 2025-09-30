
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        OrganizerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove sensitive data
    const { password, ...safeUser } = user

    return NextResponse.json({
      success: true,
      data: safeUser
    })

  } catch (error) {
    console.error('Error fetching organizer settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      email,
      currentPassword,
      newPassword,
      companyName,
      bio,
      website,
      phoneNumber,
      location,
      eventTypes
    } = await request.json()

    // If changing password, verify current password
    if (newPassword && currentPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (!user?.password || !await bcrypt.compare(currentPassword, user.password)) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const userUpdateData: any = {}
    const profileUpdateData: any = {}

    if (name !== undefined) userUpdateData.name = name
    if (email !== undefined) userUpdateData.email = email
    if (newPassword) userUpdateData.password = await bcrypt.hash(newPassword, 12)

    if (companyName !== undefined) profileUpdateData.companyName = companyName
    if (bio !== undefined) profileUpdateData.bio = bio
    if (website !== undefined) profileUpdateData.website = website
    if (phoneNumber !== undefined) profileUpdateData.phoneNumber = phoneNumber
    if (location !== undefined) profileUpdateData.location = location
    if (eventTypes !== undefined) profileUpdateData.eventTypes = eventTypes

    // Update user and profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdateData,
      include: {
        OrganizerProfile: true
      }
    })

    // Update organizer profile if there are profile changes
    if (Object.keys(profileUpdateData).length > 0) {
      await prisma.organizerProfile.upsert({
        where: { userId: session.user.id },
        update: profileUpdateData,
        create: {
          userId: session.user.id,
          ...profileUpdateData
        }
      })

      // Fetch updated user with profile
      const finalUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          OrganizerProfile: true
        }
      })

      const { password, ...safeUser } = finalUser!

      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        data: safeUser
      })
    }

    const { password, ...safeUser } = updatedUser

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: safeUser
    })

  } catch (error) {
    console.error('Error updating organizer settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
