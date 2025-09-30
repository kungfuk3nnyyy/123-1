
import { UserRole } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      adminApprovalStatus?: string
    }
  }

  interface User {
    role: UserRole
    adminApprovalStatus?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    adminApprovalStatus?: string
  }
}
