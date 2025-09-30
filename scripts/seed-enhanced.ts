
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting enhanced database seeding with comprehensive test users...')

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

  // Hash passwords - using strong passwords that meet validation requirements
  const adminPassword = await bcrypt.hash('AdminPass123!', 12)
  const talentPassword = await bcrypt.hash('TalentPass123!', 12)
  const organizerPassword = await bcrypt.hash('OrganizerPass123!', 12)
  const testPassword = await bcrypt.hash('TestPass123!', 12)

  // Create primary admin account
  const adminUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@doe.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      referralCode: 'ADMIN001'
    }
  })

  // Create secondary admin for testing admin workflows
  const adminUser2 = await prisma.user.create({
    data: {
      name: 'Admin Test User',
      email: 'admin.test@example.com',
      password: testPassword,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      referralCode: 'ADMIN002'
    }
  })

  // Create comprehensive talent test users
  const talent1 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'sarah.photographer@example.com',
      password: talentPassword,
      role: UserRole.TALENT,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      referralCode: 'TALENT001',
      TalentProfile: {
        create: {
          bio: 'Professional wedding and event photographer with 8+ years experience specializing in capturing perfect moments.',
          tagline: 'Capturing Your Perfect Moments',
          location: 'Nairobi, Kenya',
          phoneNumber: '+254701234567',
          mpesaPhoneNumber: '254701234567',
          mpesaVerified: true,
          category: 'Photography',
          skills: ['Wedding Photography', 'Event Photography', 'Portrait Photography', 'Commercial Photography'],
          experience: 'Over 8 years of professional photography experience with expertise in weddings, corporate events, and portraits.',
          hourlyRate: 25000,
          availability: 'Available weekends and evenings with advance booking.',
          averageRating: 4.8,
          totalReviews: 47,
          totalBookings: 89,
          username: 'sarahphoto',
          profileViews: 1250
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
      password: talentPassword,
      role: UserRole.TALENT,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      referralCode: 'TALENT002',
      TalentProfile: {
        create: {
          bio: 'Award-winning DJ and MC with expertise in weddings, corporate events, and entertainment services.',
          tagline: 'Music That Moves You',
          location: 'Mombasa, Kenya',
          phoneNumber: '+254702345678',
          mpesaPhoneNumber: '254702345678',
          mpesaVerified: true,
          category: 'DJ/Music',
          skills: ['DJ Services', 'MC/Hosting', 'Sound System Setup', 'Event Entertainment'],
          experience: '6 years of experience in the entertainment industry with specialization in weddings and corporate events.',
          hourlyRate: 15000,
          availability: 'Available all week with flexible scheduling.',
          averageRating: 4.6,
          totalReviews: 32,
          totalBookings: 67,
          username: 'mikedj',
          profileViews: 890
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
      password: talentPassword,
      role: UserRole.TALENT,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      referralCode: 'TALENT003',
      TalentProfile: {
        create: {
          bio: 'Expert caterer specializing in authentic Kenyan cuisine and international dishes for all types of events.',
          tagline: 'Delicious Memories, One Dish at a Time',
          location: 'Kisumu, Kenya',
          phoneNumber: '+254705678901',
          mpesaPhoneNumber: '254705678901',
          mpesaVerified: true,
          category: 'Catering',
          skills: ['Kenyan Cuisine', 'International Dishes', 'Event Catering', 'Menu Planning'],
          experience: '10 years of professional catering for events ranging from intimate gatherings to large corporate functions.',
          hourlyRate: 8000,
          availability: 'Available with advance notice for event planning.',
          averageRating: 4.8,
          totalReviews: 42,
          totalBookings: 78,
          username: 'gracecatering',
          profileViews: 650
        }
      }
    },
    include: {
      TalentProfile: true
    }
  })

  // Create test talent with different verification states
  const talentUnverified = await prisma.user.create({
    data: {
      name: 'Test Talent Unverified',
      email: 'talent.unverified@example.com',
      password: testPassword,
      role: UserRole.TALENT,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'PENDING',
      verificationStatus: 'UNVERIFIED',
      referralCode: 'TALENT004',
      TalentProfile: {
        create: {
          bio: 'Test talent account for testing unverified state workflows.',
          tagline: 'Test Talent Profile',
          location: 'Nairobi, Kenya',
          phoneNumber: '+254706789012',
          category: 'Photography',
          skills: ['Test Skill'],
          experience: 'Test experience for verification workflows.',
          hourlyRate: 5000,
          availability: 'Test availability',
          username: 'testtalent'
        }
      }
    },
    include: {
      TalentProfile: true
    }
  })

  // Create comprehensive organizer test users
  const organizer1 = await prisma.user.create({
    data: {
      name: 'EventPro Kenya',
      email: 'contact@eventpro.ke',
      password: organizerPassword,
      role: UserRole.ORGANIZER,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      referralCode: 'ORG001',
      companyName: 'EventPro Kenya Limited',
      websiteUrl: 'https://eventpro.ke',
      publicBio: 'Leading event management company in Kenya specializing in corporate events, weddings, and conferences.',
      OrganizerProfile: {
        create: {
          companyName: 'EventPro Kenya Limited',
          bio: 'Leading event management company in Kenya with over 10 years of experience in creating memorable events.',
          website: 'https://eventpro.ke',
          phoneNumber: '+254701234567',
          location: 'Nairobi, Kenya',
          eventTypes: ['Corporate Events', 'Weddings', 'Conferences', 'Product Launches'],
          totalEvents: 125,
          averageRating: 4.7
        }
      }
    },
    include: {
      OrganizerProfile: true
    }
  })

  const organizer2 = await prisma.user.create({
    data: {
      name: 'Wedding Bliss Events',
      email: 'info@weddingbliss.co.ke',
      password: organizerPassword,
      role: UserRole.ORGANIZER,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: 'VERIFIED',
      referralCode: 'ORG002',
      companyName: 'Wedding Bliss Events Ltd',
      websiteUrl: 'https://weddingbliss.co.ke',
      publicBio: 'Specialized wedding planning company creating dream weddings across Kenya.',
      OrganizerProfile: {
        create: {
          companyName: 'Wedding Bliss Events Ltd',
          bio: 'Specialized wedding planning company with expertise in creating magical wedding experiences.',
          website: 'https://weddingbliss.co.ke',
          phoneNumber: '+254702345678',
          location: 'Mombasa, Kenya',
          eventTypes: ['Weddings', 'Engagement Parties', 'Anniversary Celebrations'],
          totalEvents: 85,
          averageRating: 4.9
        }
      }
    },
    include: {
      OrganizerProfile: true
    }
  })

  // Create test organizer with different states
  const organizerTest = await prisma.user.create({
    data: {
      name: 'Test Organizer',
      email: 'organizer.test@example.com',
      password: testPassword,
      role: UserRole.ORGANIZER,
      isActive: true,
      emailVerified: new Date(),
      isEmailVerified: true,
      adminApprovalStatus: 'PENDING',
      verificationStatus: 'PENDING',
      referralCode: 'ORG003',
      companyName: 'Test Events Company',
      OrganizerProfile: {
        create: {
          companyName: 'Test Events Company',
          bio: 'Test organizer account for testing workflows.',
          phoneNumber: '+254703456789',
          location: 'Nairobi, Kenya',
          eventTypes: ['Test Events'],
          totalEvents: 0,
          averageRating: 0
        }
      }
    },
    include: {
      OrganizerProfile: true
    }
  })

  // Create sample packages with proper data
  const packages = [
    {
      talentId: talent1.TalentProfile!.id,
      title: 'Premium Wedding Photography Package',
      description: 'Comprehensive wedding photography coverage including pre-wedding consultation, engagement session, full wedding day coverage, and post-processing of all images.',
      category: 'Photography',
      location: 'Nairobi, Kenya',
      price: 120000,
      duration: 'Full Day (8-10 hours)',
      features: ['Pre-wedding Consultation', 'Engagement Session', 'Full Wedding Coverage', 'High-Resolution Images', 'Online Gallery'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent1.TalentProfile!.id,  
      title: 'Corporate Event Photography',
      description: 'Professional documentation of corporate events, conferences, and business meetings with commercial licensing included.',
      category: 'Photography',
      location: 'Nairobi, Kenya',
      price: 65000,
      duration: '6 hours',
      features: ['Event Documentation', 'High-Resolution Images', 'Commercial License', 'Same-Day Preview'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent2.TalentProfile!.id,
      title: 'Premium Wedding DJ & Entertainment',
      description: 'Complete wedding entertainment solution with professional DJ services, MC hosting, and premium sound system setup.',
      category: 'DJ/Music',
      location: 'Mombasa, Kenya',
      price: 85000,
      duration: '8 hours',
      features: ['Professional DJ Equipment', 'MC Services', 'Wireless Microphones', 'Lighting Setup', 'Music Consultation'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent2.TalentProfile!.id,
      title: 'Corporate Event DJ & Sound System',
      description: 'Professional sound system setup and background music for corporate events, conferences, and business functions.',
      category: 'DJ/Music',
      location: 'Mombasa, Kenya',
      price: 45000,
      duration: '4 hours',
      features: ['Background Music', 'Sound System Setup', 'Technical Support', 'Microphone Services'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent3.TalentProfile!.id,
      title: 'Authentic Kenyan Wedding Feast',
      description: 'Traditional Kenyan wedding catering featuring authentic local delicacies and professional service staff.',
      category: 'Catering',
      location: 'Kisumu, Kenya',
      price: 150000,
      duration: 'Full Service (Setup to Cleanup)',
      features: ['Traditional Kenyan Dishes', 'Professional Service Staff', 'Table Setup', 'Cleanup Service'],
      coverImageUrl: null,
      images: []
    },
    {
      talentId: talent3.TalentProfile!.id,
      title: 'Premium Corporate Buffet Catering',
      description: 'Elegant buffet catering service for corporate events featuring international cuisine and professional presentation.',
      category: 'Catering',
      location: 'Kisumu, Kenya',
      price: 80000,
      duration: 'Event Duration',
      features: ['International Cuisine', 'Buffet Setup', 'Serving Staff', 'Dietary Accommodations'],
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
        bookingCount: Math.floor(Math.random() * 20) + 1,
        inquiryCount: Math.floor(Math.random() * 30) + 5
      }
    })
  }

  // Create notification preferences for all users
  const allUsers = [adminUser, adminUser2, talent1, talent2, talent3, talentUnverified, organizer1, organizer2, organizerTest]
  
  for (const user of allUsers) {
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        emailMessages: true,
        emailBookings: true,
        emailPayments: true,
        emailReviews: true,
        emailReminders: true,
        emailPayouts: true,
        emailAdminUpdates: true
      }
    })
  }

  console.log('✅ Enhanced database seeding completed successfully!')
  console.log('\n📝 Test accounts created:')
  console.log('   👑 ADMIN ACCOUNTS:')
  console.log('      Primary Admin: john@doe.com / AdminPass123!')
  console.log('      Test Admin: admin.test@example.com / TestPass123!')
  console.log('\n   🎭 TALENT ACCOUNTS:')
  console.log('      Verified Photographer: sarah.photographer@example.com / TalentPass123!')
  console.log('      Verified DJ: mike.dj@example.com / TalentPass123!')
  console.log('      Verified Caterer: grace.catering@example.com / TalentPass123!')
  console.log('      Unverified Talent: talent.unverified@example.com / TestPass123!')
  console.log('\n   🏢 ORGANIZER ACCOUNTS:')
  console.log('      EventPro Kenya: contact@eventpro.ke / OrganizerPass123!')
  console.log('      Wedding Bliss: info@weddingbliss.co.ke / OrganizerPass123!')
  console.log('      Test Organizer: organizer.test@example.com / TestPass123!')
  console.log('\n📦 Created 6 sample packages across different categories')
  console.log('🔔 Created notification preferences for all users')
  console.log('\n🔐 All passwords meet validation requirements:')
  console.log('   - Minimum 8 characters')
  console.log('   - Contains uppercase, lowercase, number, and special character')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
