
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export interface DuplicateDetectionResult {
  isDuplicate: boolean
  duplicateUser?: {
    id: string
    email: string
    name: string | null
    role: UserRole
    createdAt: Date
  }
  similarityScore: number
  detectionReason: string
}

export interface PotentialDuplicate {
  userId: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
  similarityScore: number
  reasons: string[]
}

/**
 * Normalize email for consistent comparison
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Normalize phone number for consistent comparison
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  return phone.replace(/[^0-9+]/g, '')
}

/**
 * Calculate similarity score between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null))

  for (let i = 0; i <= len1; i++) matrix[0][i] = i
  for (let j = 0; j <= len2; j++) matrix[j][0] = j

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  const maxLen = Math.max(len1, len2)
  return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen
}

/**
 * Check for duplicate user during registration
 */
export async function checkForDuplicateUser(
  email: string,
  name?: string,
  phone?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<DuplicateDetectionResult> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  // Log the registration attempt
  try {
    await prisma.registrationAttempt.create({
      data: {
        emailNormalized: normalizedEmail,
        nameNormalized: name ? name.toLowerCase() : null,
        phoneNormalized: normalizedPhone,
        role: UserRole.TALENT, // Default to TALENT role, can be updated by caller
        success: false, // Will be updated if registration succeeds
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        duplicateDetected: false // Will be updated if duplicate found
      }
    });
  } catch (error) {
    console.error('Error logging registration attempt:', error);
  }

  // Check for exact email match (case-insensitive)
  const exactEmailMatch = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  })

  if (exactEmailMatch) {
    await logDuplicateDetection(
      email,
      'REGISTRATION_ATTEMPT',
      exactEmailMatch.id,
      null,
      1.0,
      'Exact email match (case-insensitive)',
      ipAddress,
      userAgent
    )

    return {
      isDuplicate: true,
      duplicateUser: exactEmailMatch,
      similarityScore: 1.0,
      detectionReason: 'Exact email match'
    }
  }

  // Check for similar emails (typos, variations)
  const similarEmails = await prisma.user.findMany({
    where: {
      OR: [
        // Check for common email variations
        { email: { contains: normalizedEmail.split('@')[0], mode: 'insensitive' } },
        // Check for similar domain
        { email: { endsWith: '@' + normalizedEmail.split('@')[1], mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  })

  // Check for phone number duplicates if provided
  let phoneMatches: any[] = []
  if (normalizedPhone) {
    phoneMatches = await prisma.$queryRaw`
      SELECT DISTINCT u.id, u.email, u.name, u.role, u."createdAt"
      FROM "User" u
      LEFT JOIN "TalentProfile" tp ON u.id = tp."userId"
      LEFT JOIN "OrganizerProfile" op ON u.id = op."userId"
      WHERE tp."phoneNormalized" = ${normalizedPhone}
         OR op."phoneNormalized" = ${normalizedPhone}
    `
  }

  // Analyze similarity scores
  const potentialDuplicates: PotentialDuplicate[] = []

  // Check email similarities
  for (const user of similarEmails) {
    const emailSimilarity = calculateSimilarity(normalizedEmail, normalizeEmail(user.email))
    const nameSimilarity = name && user.name ? calculateSimilarity(name.toLowerCase(), user.name.toLowerCase()) : 0

    if (emailSimilarity > 0.8 || nameSimilarity > 0.9) {
      const reasons = []
      if (emailSimilarity > 0.8) reasons.push(`Similar email (${(emailSimilarity * 100).toFixed(1)}% match)`)
      if (nameSimilarity > 0.9) reasons.push(`Similar name (${(nameSimilarity * 100).toFixed(1)}% match)`)

      potentialDuplicates.push({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        similarityScore: Math.max(emailSimilarity, nameSimilarity),
        reasons
      })
    }
  }

  // Check phone matches
  for (const user of phoneMatches) {
    const existing = potentialDuplicates.find(p => p.userId === user.id)
    if (existing) {
      existing.reasons.push('Same phone number')
      existing.similarityScore = Math.max(existing.similarityScore, 0.95)
    } else {
      potentialDuplicates.push({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        similarityScore: 0.95,
        reasons: ['Same phone number']
      })
    }
  }

  // Find the highest scoring potential duplicate
  const topDuplicate = potentialDuplicates.sort((a, b) => b.similarityScore - a.similarityScore)[0]

  if (topDuplicate && topDuplicate.similarityScore > 0.8) {
    await logDuplicateDetection(
      email,
      'REGISTRATION_ATTEMPT',
      topDuplicate.userId,
      null,
      topDuplicate.similarityScore,
      topDuplicate.reasons.join(', '),
      ipAddress,
      userAgent
    )

    return {
      isDuplicate: true,
      duplicateUser: {
        id: topDuplicate.userId,
        email: topDuplicate.email,
        name: topDuplicate.name,
        role: topDuplicate.role,
        createdAt: topDuplicate.createdAt
      },
      similarityScore: topDuplicate.similarityScore,
      detectionReason: topDuplicate.reasons.join(', ')
    }
  }

  return {
    isDuplicate: false,
    similarityScore: 0,
    detectionReason: 'No duplicates detected'
  }
}

/**
 * Log duplicate detection for monitoring and analysis
 */
export async function logDuplicateDetection(
  email: string,
  detectionType: 'REGISTRATION_ATTEMPT' | 'EXISTING_SCAN' | 'MANUAL_CHECK',
  potentialDuplicateUserId: string | null,
  originalUserId: string | null,
  similarityScore: number,
  detectionReason: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    // Check if the model exists in the Prisma client
    if ('duplicateDetectionLog' in prisma) {
      await (prisma as any).duplicateDetectionLog.create({
        data: {
          email,
          emailNormalized: normalizeEmail(email),
          detectionType,
          potentialDuplicateUserId,
          originalUserId,
          similarityScore,
          detectionReason,
          ipAddress,
          userAgent,
          resolved: false
        }
      });
    } else {
      console.warn('duplicateDetectionLog model not found in Prisma schema');
    }
  } catch (error) {
    console.error('Error logging duplicate detection:', error);
  }
}

/**
 * Find existing duplicate users in the system
 */
export async function findExistingDuplicates(): Promise<PotentialDuplicate[]> {
  // Find users with similar emails
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      TalentProfile: {
        select: {
          phoneNumber: true
        }
      },
      OrganizerProfile: {
        select: {
          phoneNumber: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  const duplicates: PotentialDuplicate[] = []
  const processedEmails = new Set<string>()

  for (let i = 0; i < users.length; i++) {
    const user1 = users[i]
    const normalizedEmail1 = normalizeEmail(user1.email)

    if (processedEmails.has(normalizedEmail1)) continue

    for (let j = i + 1; j < users.length; j++) {
      const user2 = users[j]
      const normalizedEmail2 = normalizeEmail(user2.email)

      const emailSimilarity = calculateSimilarity(normalizedEmail1, normalizedEmail2)
      const nameSimilarity = user1.name && user2.name ? 
        calculateSimilarity(user1.name.toLowerCase(), user2.name.toLowerCase()) : 0

      const phone1 = normalizePhone(user1.TalentProfile?.phoneNumber || user1.OrganizerProfile?.phoneNumber)
      const phone2 = normalizePhone(user2.TalentProfile?.phoneNumber || user2.OrganizerProfile?.phoneNumber)
      const phoneMatch = phone1 && phone2 && phone1 === phone2

      const reasons = []
      let maxSimilarity = 0

      if (emailSimilarity > 0.8) {
        reasons.push(`Similar email (${(emailSimilarity * 100).toFixed(1)}% match)`)
        maxSimilarity = Math.max(maxSimilarity, emailSimilarity)
      }

      if (nameSimilarity > 0.9) {
        reasons.push(`Similar name (${(nameSimilarity * 100).toFixed(1)}% match)`)
        maxSimilarity = Math.max(maxSimilarity, nameSimilarity)
      }

      if (phoneMatch) {
        reasons.push('Same phone number')
        maxSimilarity = Math.max(maxSimilarity, 0.95)
      }

      if (reasons.length > 0 && maxSimilarity > 0.8) {
        duplicates.push({
          userId: user2.id,
          email: user2.email,
          name: user2.name,
          role: user2.role,
          createdAt: user2.createdAt,
          similarityScore: maxSimilarity,
          reasons
        })

        // Log the detection
        await logDuplicateDetection(
          user2.email,
          'EXISTING_SCAN',
          user2.id,
          user1.id,
          maxSimilarity,
          reasons.join(', ')
        )
      }
    }

    processedEmails.add(normalizedEmail1)
  }

  return duplicates
}
/**
 * Get duplicate detection statistics
 */
export async function getDuplicateStats() {
  // Check if the model exists in the Prisma client
  const hasDuplicateDetectionLog = 'duplicateDetectionLog' in prisma;
  
  // If the model doesn't exist, return default values
  if (!hasDuplicateDetectionLog) {
    console.warn('duplicateDetectionLog model not found in Prisma schema');
    return {
      totalDetections: 0,
      unresolvedDetections: 0,
      registrationAttempts: 0,
      recentDetections: 0
    };
  }

  const [totalDetections, unresolvedDetections, registrationAttempts, recentDetections] = await Promise.all([
    (prisma as any).duplicateDetectionLog.count(),
    (prisma as any).duplicateDetectionLog.count({ where: { resolved: false } }),
    prisma.registrationAttempt.count({ where: { duplicateDetected: true } }),
    (prisma as any).duplicateDetectionLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  ])

  return {
    totalDetections,
    unresolvedDetections,
    registrationAttempts,
    recentDetections
  }
}
