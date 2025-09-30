
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { normalizeEmail } from './duplicate-detection'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Find user by email (case-insensitive)
          const user = await prisma.user.findFirst({
            where: { 
              email: {
                equals: normalizeEmail(credentials.email),
                mode: 'insensitive'
              }
            },
            include: {
              TalentProfile: true,
              OrganizerProfile: true
            }
          })

          if (!user || !user.password) {
            throw new Error('Invalid credentials')
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error('Invalid credentials')
          }

          // Check if email is verified
          if (!user.isEmailVerified) {
            throw new Error('Email not verified. Please check your email and verify your account before logging in.')
          }

          // Check admin approval status for admin users
          if (user.role === UserRole.ADMIN && user.adminApprovalStatus !== 'APPROVED') {
            if (user.adminApprovalStatus === 'PENDING') {
              throw new Error('Your admin account is pending approval. Please wait for an existing admin to approve your account.')
            } else if (user.adminApprovalStatus === 'REJECTED') {
              throw new Error('Your admin account has been rejected. Please contact support for assistance.')
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            adminApprovalStatus: user.adminApprovalStatus
          }

        } catch (error) {
          // Authentication error - rethrow to NextAuth
          throw error
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.adminApprovalStatus = (user as any).adminApprovalStatus
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.adminApprovalStatus = token.adminApprovalStatus as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login'
  }
}
