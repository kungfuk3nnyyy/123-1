import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Handle connection errors and graceful shutdown
prisma.$on('beforeExit' as never, async () => {
  await prisma.$disconnect()
})

// Handle Prisma errors
prisma.$use(async (params, next) => {
  try {
    return await next(params)
  } catch (error) {
    console.error('Prisma Client Error:', error)
    throw error
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
