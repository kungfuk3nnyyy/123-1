
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { organizerProfileUpdateSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get organizer profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        OrganizerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare profile data for the form
    const profileData = {
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      companyName: user.OrganizerProfile?.companyName || user.companyName || '',
      bio: user.OrganizerProfile?.bio || user.publicBio || '',
      website: user.OrganizerProfile?.website || user.websiteUrl || '',
      phoneNumber: user.OrganizerProfile?.phoneNumber || '',
      location: user.OrganizerProfile?.location || '',
      eventTypes: user.OrganizerProfile?.eventTypes || [],
      totalEvents: user.OrganizerProfile?.totalEvents || 0,
      averageRating: user.OrganizerProfile?.averageRating || null
    }

    return NextResponse.json({
      success: true,
      data: profileData
    })

  } catch (error) {
    console.error('Get organizer profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    // Validate the request body
    const validationResult = organizerProfileUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const profileData = validationResult.data

    // Update user basic info if provided
    const userUpdateData: any = {}
    if (body.firstName && body.lastName) {
      userUpdateData.name = `${body.firstName} ${body.lastName}`
    }
    if (profileData.companyName) {
      userUpdateData.companyName = profileData.companyName
    }
    if (profileData.bio) {
      userUpdateData.publicBio = profileData.bio
    }
    if (profileData.website) {
      userUpdateData.websiteUrl = profileData.website
    }

    // Update user record if there's data to update
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      })
    }

    // Upsert organizer profile
    const organizerProfile = await prisma.organizerProfile.upsert({
      where: { userId },
      update: {
        companyName: profileData.companyName,
        bio: profileData.bio,
        website: profileData.website,
        phoneNumber: profileData.phoneNumber,
        location: profileData.location,
        eventTypes: profileData.eventTypes || []
      },
      create: {
        userId,
        companyName: profileData.companyName,
        bio: profileData.bio,
        website: profileData.website,
        phoneNumber: profileData.phoneNumber,
        location: profileData.location,
        eventTypes: profileData.eventTypes || []
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: organizerProfile
    })

  } catch (error) {
    console.error('Update organizer profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
