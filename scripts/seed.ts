import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data in correct order (child records first)
  await prisma.package.deleteMany()
  await prisma.review.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.message.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.event.deleteMany()
  await prisma.file.deleteMany()
  await prisma.bankAccount.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.talentProfile.deleteMany()
  await prisma.organizerProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Hash passwords
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  const hashedTalentPassword = await bcrypt.hash('password123', 12)
  const hashedOrganizerPassword = await bcrypt.hash('password123', 12)

  // Create test admin account
  const adminUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@doe.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      // --- CRITICAL FIX: Set adminApprovalStatus to APPROVED on creation ---
      adminApprovalStatus: 'APPROVED'
    }
  })

  // Create sample talents
  const talent1 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'sarah.photographer@example.com',
      password: hashedTalentPassword,
      role: UserRole.TALENT,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      TalentProfile: {
        create: {
          bio: 'Professional wedding and event photographer with 8+ years experience.',
          tagline: 'Capturing Your Perfect Moments',
          location: 'Nairobi, Kenya',
          phoneNumber: '+254-701-234-567',
          mpesaPhoneNumber: '254701234567',
          mpesaVerified: true,
          category: 'Photography',
          skills: ['Wedding Photography', 'Event Photography', 'Portrait Photography'],
          experience: 'Over 8 years of professional photography experience.',
          hourlyRate: 25000,
          availability: 'Available weekends and evenings.',
          averageRating: 4.8,
          totalReviews: 47,
          totalBookings: 89
        }
      }
    },
    include: {
      TalentProfile: true
    }
  })

  const talent2 = await prisma.user.create({
    data: {
      name: 'Michael Davis',
      email: 'mike.dj@example.com',
      password: hashedTalentPassword,
      role: UserRole.TALENT,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      TalentProfile: {
        create: {
          bio: 'Award-winning DJ and MC with expertise in weddings and corporate events.',
          tagline: 'Music That Moves You',
          location: 'Mombasa, Kenya',
          phoneNumber: '+254-702-345-678',
          mpesaPhoneNumber: '254702345678',
          mpesaVerified: true,
          category: 'DJ/Music',
          skills: ['DJ Services', 'MC/Hosting', 'Sound System Setup'],
          experience: '6 years of experience in the entertainment industry.',
          hourlyRate: 15000,
          availability: 'Available all week.',
          averageRating: 4.6,
          totalReviews: 32,
          totalBookings: 67
        }
      }
    },
    include: {
      TalentProfile: true
    }
  })

  const talent3 = await prisma.user.create({
    data: {
      name: 'Grace Mwangi',
      email: 'grace.catering@example.com',
      password: hashedTalentPassword,
      role: UserRole.TALENT,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      TalentProfile: {
        create: {
          bio: 'Expert caterer specializing in authentic Kenyan cuisine.',
          tagline: 'Delicious Memories, One Dish at a Time',
          location: 'Kisumu, Kenya',
          phoneNumber: '+254-705-678-901',
          mpesaPhoneNumber: '254705678901',
          mpesaVerified: true,
          category: 'Catering',
          skills: ['Kenyan Cuisine', 'International Dishes', 'Event Catering'],
          experience: '10 years of professional catering for events.',
          hourlyRate: 8000,
          availability: 'Available with advance notice.',
          averageRating: 4.8,
          totalReviews: 42,
          totalBookings: 78
        }
      }
    },
    include: {
      TalentProfile: true
    }
  })

  // Create organizer
  const organizer1 = await prisma.user.create({
    data: {
      name: 'EventPro Kenya',
      email: 'contact@eventpro.ke',
      password: hashedOrganizerPassword,
      role: UserRole.ORGANIZER,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      OrganizerProfile: {
        create: {
          companyName: 'EventPro Kenya Limited',
          bio: 'Leading event management company in Kenya.',
          phoneNumber: '+254-701-234-567',
          location: 'Nairobi, Kenya',
          eventTypes: ['Corporate Events', 'Weddings', 'Conferences'],
          totalEvents: 125,
          averageRating: 4.7
        }
      }
    },
    include: {
      OrganizerProfile: true
    }
  })

  // Create sample packages (without problematic image URLs)
  const packages = [
    {
      talentId: talent1.TalentProfile!.id,
      title: 'Luxury Wedding Photography',
      description: 'Comprehensive wedding photography coverage from getting ready to reception.',
      category: 'Photography',
      location: 'Nairobi, Kenya',
      price: 120000,
      duration: 'Full Day',
      features: ['Pre-wedding Consultation', 'Engagement Session', 'Full Wedding Coverage'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent1.TalentProfile!.id,  
      title: 'Corporate Event Photography',
      description: 'Professional documentation of corporate events and business meetings.',
      category: 'Photography',
      location: 'Nairobi, Kenya',
      price: 65000,
      duration: '6 hours',
      features: ['Event Documentation', 'High-Resolution Images', 'Commercial License'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent2.TalentProfile!.id,
      title: 'Premium Wedding DJ Package',
      description: 'Complete wedding entertainment solution with DJ and MC services.',
      category: 'DJ/Music',
      location: 'Mombasa, Kenya',
      price: 85000,
      duration: '8 hours',
      features: ['Professional DJ Equipment', 'MC Services', 'Wireless Microphones'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent2.TalentProfile!.id,
      title: 'Corporate Event DJ & Sound',
      description: 'Professional sound system setup for corporate events.',
      category: 'DJ/Music',
      location: 'Mombasa, Kenya',
      price: 45000,
      duration: '4 hours',
      features: ['Background Music', 'Sound System Setup', 'Technical Support'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent3.TalentProfile!.id,
      title: 'Authentic Kenyan Wedding Feast',
      description: 'Traditional Kenyan wedding catering with local delicacies.',
      category: 'Catering',
      location: 'Kisumu, Kenya',
      price: 150000,
      duration: 'Full Service',
      features: ['Traditional Kenyan Dishes', 'Professional Service Staff'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent3.TalentProfile!.id,
      title: 'Premium Buffet Catering',
      description: 'Elegant buffet catering service for corporate events.',
      category: 'Catering',
      location: 'Kisumu, Kenya',
      price: 80000,
      duration: 'Event Duration',
      features: ['International Cuisine', 'Buffet Setup', 'Serving Staff'],
      coverImageUrl: null,
      images: []
    }
  ]

  // Create packages
  for (const packageData of packages) {
    await prisma.package.create({
      data: {
        ...packageData,
        price: packageData.price,
        isPublished: true,
        isActive: true,
        viewCount: Math.floor(Math.random() * 200) + 50,
        bookingCount: Math.floor(Math.random() * 20) + 1
      }
    })
  }

  console.log('✅ Database seeding completed successfully!')
  console.log('📝 Test accounts created:')
  console.log('   Admin: john@doe.com / johndoe123')
  console.log('   Talent: sarah.photographer@example.com / password123')
  console.log('   Organizer: contact@eventpro.ke / password123')
  console.log('📦 Created 6 sample packages across different categories')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
