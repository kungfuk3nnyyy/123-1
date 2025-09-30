
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mpesaPhoneNumber } = await request.json()

    // Validate phone number format
    if (!mpesaPhoneNumber || typeof mpesaPhoneNumber !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Normalize phone number (remove any non-digit characters and leading 0 if present)
    let normalizedNumber = mpesaPhoneNumber.replace(/\D/g, '')
    
    // Convert to 254 format if it starts with 0 or 7
    if (normalizedNumber.startsWith('0')) {
      normalizedNumber = '254' + normalizedNumber.substring(1)
    } else if (normalizedNumber.startsWith('7')) {
      normalizedNumber = '254' + normalizedNumber
    }
    
    // Validate Kenyan M-Pesa number format (254XXXXXXXXX)
    const phoneRegex = /^254[17]\d{8}$/
    if (!phoneRegex.test(normalizedNumber)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format. Must be a valid Kenyan M-Pesa number (e.g., 254712345678, 0712345678, or 712345678)' 
      }, { status: 400 })
    }

    // Check if phone number is already in use by another talent
    const existingTalent = await prisma.talentProfile.findFirst({
      where: {
        mpesaPhoneNumber: mpesaPhoneNumber,
        userId: { not: session.user.id }
      }
    })

    if (existingTalent) {
      return NextResponse.json({ 
        error: 'This M-Pesa number is already registered to another talent' 
      }, { status: 409 })
    }

    // Update or create talent profile with M-Pesa number
    const talentProfile = await prisma.talentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        mpesaPhoneNumber: normalizedNumber,
        mpesaVerified: false // Reset verification when phone number changes
      },
      create: {
        userId: session.user.id,
        mpesaPhoneNumber: normalizedNumber,
        mpesaVerified: false
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'M-Pesa phone number updated successfully',
      data: {
        mpesaPhoneNumber: talentProfile.mpesaPhoneNumber,
        mpesaVerified: talentProfile.mpesaVerified
      }
    })

  } catch (error) {
    console.error('M-Pesa update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current M-Pesa details
    const talentProfile = await prisma.talentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        mpesaPhoneNumber: true,
        mpesaVerified: true
      }
    })

    return NextResponse.json({ 
      success: true,
      data: {
        mpesaPhoneNumber: talentProfile?.mpesaPhoneNumber || null,
        mpesaVerified: talentProfile?.mpesaVerified || false
      }
    })

  } catch (error) {
    console.error('M-Pesa fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
