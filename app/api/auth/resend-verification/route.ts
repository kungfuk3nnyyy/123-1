
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const { token, hashedToken, expiry } = generateVerificationToken()

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: expiry
      }
    })

    // Send verification email
    const emailSent = await sendVerificationEmail(email, user.name || 'User', token)
    
    if (!emailSent) {
      console.error('Failed to resend verification email for:', email)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification email sent successfully. Please check your email.',
      success: true
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
