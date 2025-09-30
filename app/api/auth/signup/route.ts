
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email-service'
import { generateReferralCode, processReferral } from '@/lib/referral-service'
import { checkForDuplicateUser, normalizeEmail, normalizePhone } from '@/lib/duplicate-detection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, referralCode: invitingUserCode, phoneNumber } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Get client IP and user agent for tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Enhanced duplicate detection
    const duplicateCheck = await checkForDuplicateUser(
      email,
      name,
      phoneNumber,
      ipAddress,
      userAgent
    )

    if (duplicateCheck.isDuplicate) {
      // Log the duplicate registration attempt
      await prisma.registrationAttempt.updateMany({
        where: {
          emailNormalized: normalizeEmail(email),
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        data: {
          duplicateDetected: true,
          duplicateUserId: duplicateCheck.duplicateUser?.id,
          failureReason: `Duplicate detected: ${duplicateCheck.detectionReason}`
        }
      })

      // Return specific error message based on detection reason
      if (duplicateCheck.similarityScore === 1.0) {
        return NextResponse.json(
          { 
            error: 'An account with this email already exists. Please try logging in instead.',
            duplicateDetected: true,
            existingEmail: duplicateCheck.duplicateUser?.email,
            suggestedAction: 'LOGIN'
          },
          { status: 409 }
        )
      } else {
        return NextResponse.json(
          { 
            error: `A similar account may already exist (${duplicateCheck.detectionReason}). Please check your email or contact support if you believe this is an error.`,
            duplicateDetected: true,
            similarityScore: duplicateCheck.similarityScore,
            suggestedAction: 'CONTACT_SUPPORT'
          },
          { status: 409 }
        )
      }
    }

    // Check if user already exists (additional safety check)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizeEmail(email),
          mode: 'insensitive'
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password & generate email verification token
    const hashedPassword = await bcrypt.hash(password, 12)
    const { token: verificationToken, hashedToken, expiry } = generateVerificationToken()
    
    // Create the user and their profile within a single, safe transaction
    const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name,
                email: normalizeEmail(email), // Store normalized email
                password: hashedPassword,
                role,
                isEmailVerified: false,
                emailVerificationToken: hashedToken,
                emailVerificationExpiry: expiry,
                accountCreditKes: 0,
                adminApprovalStatus: role === UserRole.ADMIN ? 'PENDING' : 'APPROVED',
            }
        });

        // Create the corresponding profile based on the user's role
        if (role === UserRole.TALENT) {
            await tx.talentProfile.create({
                data: { 
                  userId: user.id, 
                  bio: '', 
                  skills: [],
                  phoneNumber: phoneNumber || null
                }
            });
        } else if (role === UserRole.ORGANIZER) {
            await tx.organizerProfile.create({
                data: { 
                  userId: user.id, 
                  eventTypes: [],
                  phoneNumber: phoneNumber || null
                }
            });
        }
        
        return user;
    });

    // Update registration attempt as successful
    await prisma.registrationAttempt.updateMany({
      where: {
        emailNormalized: normalizeEmail(email),
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      data: {
        success: true,
        role: role
      }
    })

    // --- New Step: Generate and assign referral code AFTER the user is created ---
    try {
        const newUserReferralCode = await generateReferralCode(newUser.id);
        await prisma.user.update({
            where: { id: newUser.id },
            data: { referralCode: newUserReferralCode }
        });
    } catch (referralError) {
        console.error(`Could not generate referral code for user ${newUser.id}:`, referralError);
        // This is not a critical error, so we allow the signup to continue.
    }
    
    // Process the referral from the inviting user (if one was provided)
    let referralProcessed = false
    let referralReward = 0
    if (invitingUserCode?.trim()) {
      try {
        await processReferral(newUser.email, invitingUserCode.trim())
        referralProcessed = true
        referralReward = 500 // KES 500 if referred
      } catch (error) {
        console.error('Error processing referral during signup:', error)
        // Don't fail the registration if referral processing fails
      }
    }

    // Send verification email
    try {
        await sendVerificationEmail(email, name, verificationToken)
    } catch(emailError) {
        console.error('Failed to send verification email for:', email, emailError)
    }

    return NextResponse.json({
      message: 'Registration successful! Please check your email to verify your account.',
      requiresEmailVerification: true,
      email: email,
      referralProcessed,
      referralReward
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
