
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      currentPassword,
      newPassword,
      emailNotifications,
      smsNotifications,
      marketingEmails,
      mpesaPhoneNumber
    } = await request.json()

    const updateData: any = {}
    const updateTalentData: any = {}

    // Handle password change
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (!user?.password) {
        return NextResponse.json({ error: 'Current password not found' }, { status: 400 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)
      updateData.password = hashedPassword
    }

    // Handle notification preferences
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications
    if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails

    // Handle MPESA phone number update
    if (mpesaPhoneNumber !== undefined) {
      // Normalize the phone number
      let normalizedNumber = mpesaPhoneNumber.replace(/\D/g, '')
      
      // Convert to 254 format if it starts with 0 or 7
      if (normalizedNumber.startsWith('0')) {
        normalizedNumber = '254' + normalizedNumber.substring(1)
      } else if (normalizedNumber.startsWith('7')) {
        normalizedNumber = '254' + normalizedNumber
      }
      
      // Validate the number format
      const phoneRegex = /^254[17]\d{8}$/
      if (!phoneRegex.test(normalizedNumber)) {
        return NextResponse.json({ 
          error: 'Invalid phone number format. Must be a valid Kenyan M-Pesa number (e.g., 254712345678, 0712345678, or 712345678)' 
        }, { status: 400 })
      }
      
      updateTalentData.mpesaPhoneNumber = normalizedNumber
    }

    // Update user settings
    const [updatedUser] = await Promise.all([
      prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          emailNotifications: true,
          smsNotifications: true,
          marketingEmails: true,
          TalentProfile: {
            select: {
              mpesaPhoneNumber: true,
              mpesaVerified: true
            }
          }
        }
      }),
      // Update talent profile if there are MPESA updates
      Object.keys(updateTalentData).length > 0 
        ? prisma.talentProfile.upsert({
            where: { userId: session.user.id },
            update: updateTalentData,
            create: {
              userId: session.user.id,
              ...updateTalentData
            }
          })
        : Promise.resolve(null)
    ])

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updatedUser,
        mpesaPhoneNumber: updatedUser.TalentProfile?.mpesaPhoneNumber || null,
        mpesaVerified: updatedUser.TalentProfile?.mpesaVerified || false
      },
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
