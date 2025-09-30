
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/email-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verification-error?reason=missing-token', request.url))
    }

    // Find user with verification token
    const users = await prisma.user.findMany({
      where: {
        emailVerificationToken: { not: null },
        emailVerificationExpiry: { not: null },
        isEmailVerified: false
      }
    })

    let userToVerify = null
    
    // Check token against all users (since we can't query by hashed token directly)
    for (const user of users) {
      if (user.emailVerificationToken && verifyToken(token, user.emailVerificationToken)) {
        userToVerify = user
        break
      }
    }

    if (!userToVerify) {
      return NextResponse.redirect(new URL('/auth/verification-error?reason=invalid-token', request.url))
    }

    // Check if token has expired
    if (!userToVerify.emailVerificationExpiry || new Date() > userToVerify.emailVerificationExpiry) {
      return NextResponse.redirect(new URL('/auth/verification-error?reason=expired-token', request.url))
    }

    // Check if user is already verified
    if (userToVerify.isEmailVerified) {
      return NextResponse.redirect(new URL('/auth/verification-success?already-verified=true', request.url))
    }

    // Update user verification status
    await prisma.user.update({
      where: { id: userToVerify.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        emailVerified: new Date() // Update NextAuth's emailVerified field as well
      }
    })

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verification-success', request.url))

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/auth/verification-error?reason=server-error', request.url))
  }
}
