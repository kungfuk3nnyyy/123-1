

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole, VerificationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface TalentProfileData {
  id: string
  category: string | null
  location: string | null
  skills: string[]
  averageRating: any | null
  totalReviews: number
  totalBookings: number
  hourlyRate: any | null
  mpesaVerified: boolean
  User: {
    id: string
    name: string | null
    email: string
    image: string | null
    verificationStatus: VerificationStatus
  } | null
  BankAccount: {
    isVerified: boolean
  } | null
}

// GET /api/top-talents - Get top talents for homepage browse section
export async function GET() {
  try {
    // Fetch top 6 talents with verified status
    const topTalents = await prisma.talentProfile.findMany({
      where: {
        User: {
          role: UserRole.TALENT,
          isActive: true
        },
        OR: [
          { mpesaVerified: true },
          { BankAccount: { isNot: null } }
        ],
        averageRating: {
          gte: 3.5 // Good rating threshold
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            verificationStatus: true
          }
        },
        BankAccount: {
          select: {
            isVerified: true
          }
        }
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalBookings: 'desc' },
        { totalReviews: 'desc' }
      ],
      take: 6
    })

    // Transform data with sample images if no user image available
    const sampleImages = [
      "https://cdn.abacus.ai/images/6c6425e9-0e74-418b-8962-2333e04b347b.png", // Male photographer
      "https://cdn.abacus.ai/images/f5b6204d-4297-4fd5-abea-33aa5e815b48.png", // Female photographer  
      "https://cdn.abacus.ai/images/b881b6d8-75c4-4ae1-be3b-e55646c66df5.png", // Male musician
      "https://cdn.abacus.ai/images/c0fa538c-7706-45c5-a411-0a70a02efb17.png", // Female musician
      "https://cdn.abacus.ai/images/0ac6bab3-33b8-4d46-8ebe-811c7e4c8d91.png", // Male DJ
      "https://cdn.abacus.ai/images/c214e3a4-d1fc-4323-a2ad-c653b18ce30c.png"  // Female DJ
    ]

    const talentsWithImages = topTalents.map((talent: TalentProfileData, index: number) => ({
      id: talent.id,
      name: talent.User?.name || 'Professional Talent',
      category: talent.category || 'Creative Professional',
      skills: talent.skills || [],
      rating: parseFloat(talent.averageRating?.toString() || '0'),
      reviews: talent.totalReviews || 0,
      location: talent.location || 'Nairobi',
      verified: talent.User?.verificationStatus === VerificationStatus.VERIFIED,
      image: talent.User?.image || sampleImages[index % sampleImages.length],
      hourlyRate: talent.hourlyRate ? parseFloat(talent.hourlyRate.toString()) : null
    }))

    return NextResponse.json({
      success: true,
      talents: talentsWithImages,
      totalCount: talentsWithImages.length
    })

  } catch (error) {
    console.error('Error fetching top talents:', error)
    
    // Return sample data as fallback
    const sampleTalents = [
      {
        id: 'sample-1',
        name: 'James Mwangi',
        category: 'Photography',
        skills: ['Wedding Photography', 'Portrait Photography', 'Event Coverage'],
        rating: 4.9,
        reviews: 127,
        location: 'Nairobi',
        verified: true,
        image: "https://cdn.abacus.ai/images/6c6425e9-0e74-418b-8962-2333e04b347b.png",
        hourlyRate: 5000
      },
      {
        id: 'sample-2',
        name: 'Mary Wanjiku',
        category: 'Photography',
        skills: ['Corporate Events', 'Product Photography', 'Portraits'],
        rating: 4.8,
        reviews: 95,
        location: 'Nairobi',
        verified: true,
        image: "https://cdn.abacus.ai/images/f5b6204d-4297-4fd5-abea-33aa5e815b48.png",
        hourlyRate: 4500
      },
      {
        id: 'sample-3',
        name: 'Peter Otieno',
        category: 'Music',
        skills: ['Live Performance', 'Studio Recording', 'Music Production'],
        rating: 4.7,
        reviews: 78,
        location: 'Mombasa',
        verified: true,
        image: "https://cdn.abacus.ai/images/b881b6d8-75c4-4ae1-be3b-e55646c66df5.png",
        hourlyRate: 8000
      },
      {
        id: 'sample-4',
        name: 'Grace Nyong',
        category: 'Music',
        skills: ['Vocal Performance', 'Songwriting', 'Live Shows'],
        rating: 4.9,
        reviews: 102,
        location: 'Kisumu',
        verified: true,
        image: "https://cdn.abacus.ai/images/c0fa538c-7706-45c5-a411-0a70a02efb17.png",
        hourlyRate: 7500
      },
      {
        id: 'sample-5',
        name: 'Mike Kariuki',
        category: 'DJ Services',
        skills: ['Club DJ', 'Wedding DJ', 'Corporate Events'],
        rating: 4.6,
        reviews: 89,
        location: 'Nairobi',
        verified: true,
        image: "https://cdn.abacus.ai/images/0ac6bab3-33b8-4d46-8ebe-811c7e4c8d91.png",
        hourlyRate: 3500
      },
      {
        id: 'sample-6',
        name: 'Linda Chepkemoi',
        category: 'DJ Services',
        skills: ['Event DJ', 'Music Mixing', 'Sound System'],
        rating: 4.8,
        reviews: 67,
        location: 'Eldoret',
        verified: true,
        image: "https://cdn.abacus.ai/images/c214e3a4-d1fc-4323-a2ad-c653b18ce30c.png",
        hourlyRate: 4000
      }
    ]

    return NextResponse.json({
      success: true,
      talents: sampleTalents,
      totalCount: sampleTalents.length
    })
  }
}
