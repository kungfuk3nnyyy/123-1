
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        TalentProfile: {
          include: {
            BankAccount: true,
            File: true
          }
        },
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
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { 
      name, 
      email, 
      currentPassword, 
      newPassword,
      // Talent profile fields
      bio,
      tagline,
      location,
      website,
      phoneNumber,
      category,
      skills,
      experience,
      hourlyRate,
      availability,
      // Organizer profile fields
      companyName,
      eventTypes
    } = data

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

    // Update user data
    const userUpdateData: any = {}
    if (name !== undefined) userUpdateData.name = name
    if (email !== undefined) userUpdateData.email = email
    if (newPassword) userUpdateData.password = await bcrypt.hash(newPassword, 12)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdateData,
      include: {
        TalentProfile: {
          include: {
            BankAccount: true,
            File: true
          }
        }
      }
    })

    // Update talent profile if user is a talent
    if (session.user.role === 'TALENT') {
      const talentUpdateData: any = {}
      
      if (bio !== undefined) talentUpdateData.bio = bio
      if (tagline !== undefined) talentUpdateData.tagline = tagline
      if (location !== undefined) talentUpdateData.location = location
      if (website !== undefined) talentUpdateData.website = website
      if (phoneNumber !== undefined) talentUpdateData.phoneNumber = phoneNumber
      if (category !== undefined) talentUpdateData.category = category
      if (skills !== undefined) talentUpdateData.skills = skills
      if (experience !== undefined) talentUpdateData.experience = experience
      if (hourlyRate !== undefined) talentUpdateData.hourlyRate = parseFloat(hourlyRate)
      if (availability !== undefined) talentUpdateData.availability = availability

      if (Object.keys(talentUpdateData).length > 0) {
        await prisma.talentProfile.upsert({
          where: { userId: session.user.id },
          update: talentUpdateData,
          create: {
            userId: session.user.id,
            ...talentUpdateData
          }
        })
      }
    }

    // Update organizer profile if user is an organizer
    if (session.user.role === 'ORGANIZER') {
      const organizerUpdateData: any = {}
      
      if (companyName !== undefined) organizerUpdateData.companyName = companyName
      if (bio !== undefined) organizerUpdateData.bio = bio
      if (website !== undefined) organizerUpdateData.website = website
      if (phoneNumber !== undefined) organizerUpdateData.phoneNumber = phoneNumber
      if (location !== undefined) organizerUpdateData.location = location
      if (eventTypes !== undefined) organizerUpdateData.eventTypes = eventTypes

      if (Object.keys(organizerUpdateData).length > 0) {
        await prisma.organizerProfile.upsert({
          where: { userId: session.user.id },
          update: organizerUpdateData,
          create: {
            userId: session.user.id,
            ...organizerUpdateData
          }
        })
      }
    }

    // Fetch updated user data
    const finalUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        TalentProfile: {
          include: {
            BankAccount: true,
            File: true
          }
        },
        OrganizerProfile: true
      }
    })

    const { password, ...safeUser } = finalUser!

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: safeUser
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
