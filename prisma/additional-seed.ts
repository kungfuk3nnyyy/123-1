import { PrismaClient, UserRole, VerificationStatus, AdminApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding additional test accounts...');

  try {
    // Additional Talent Users with different categories and statuses
    const talent5 = await prisma.user.create({
      data: {
        name: 'David Decorator',
        email: 'david.decor@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'Creative event decorator and designer specializing in transforming spaces into memorable experiences for any occasion.',
            tagline: 'Transforming spaces, creating memories',
            category: 'Decoration & Design',
            location: 'Eldoret',
            skills: ['Event Decoration', 'Floral Arrangements', 'Lighting Design', 'Theme Development', 'Space Planning'],
            experience: '7+ years',
            hourlyRate: 5500,
            averageRating: 4.6,
            totalReviews: 15,
            totalBookings: 28,
            phoneNumber: '+254712345005',
            mpesaPhoneNumber: '+254712345005',
            mpesaVerified: false,
          }
        }
      },
      include: {
        TalentProfile: true,
      },
    });

    const talent6 = await prisma.user.create({
      data: {
        name: 'James Security',
        email: 'james.security@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'Professional security services provider with trained personnel for events of all sizes, ensuring safety and peace of mind.',
            tagline: 'Your safety is our priority',
            category: 'Security & Safety',
            location: 'Nairobi',
            skills: ['Event Security', 'Crowd Control', 'VIP Protection', 'Emergency Response', 'Risk Assessment'],
            experience: '15+ years',
            hourlyRate: 3000,
            averageRating: 4.9,
            totalReviews: 22,
            totalBookings: 56,
            phoneNumber: '+254712345006',
            mpesaPhoneNumber: '+254712345006',
            mpesaVerified: true,
          }
        }
      },
      include: {
        TalentProfile: true,
      },
    });

    // Unverified talent (email not verified)
    const unverifiedTalent = await prisma.user.create({
      data: {
        name: 'Unverified Talent',
        email: 'unverified.talent@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.UNVERIFIED,
        adminApprovalStatus: AdminApprovalStatus.PENDING,
        isActive: true,
        isEmailVerified: false,
        TalentProfile: {
          create: {
            bio: 'Transportation service provider for events.',
            tagline: 'Reliable transport solutions',
            category: 'Transportation',
            location: 'Kitale',
            skills: ['Event Transportation', 'Logistics'],
            experience: '3+ years',
            hourlyRate: 2500,
            phoneNumber: '+254712345009',
          }
        }
      },
    });

    // Additional Organizer Users with different statuses
    const organizer3 = await prisma.user.create({
      data: {
        name: 'John Personal Organizer',
        email: 'john.organizer@test.com',
        password: await bcrypt.hash('organizer123', 10),
        role: UserRole.ORGANIZER,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        OrganizerProfile: {
          create: {
            bio: 'Individual event organizer specializing in private parties and small gatherings.',
            location: 'Kisumu',
            phoneNumber: '+254712345012',
            eventTypes: ['Private Parties', 'Birthday Parties', 'Small Gatherings'],
            totalEvents: 23,
            averageRating: 4.5,
          }
        }
      },
    });

    // Pending organizer
    const pendingOrganizer = await prisma.user.create({
      data: {
        name: 'Pending Organizer',
        email: 'pending.organizer@test.com',
        password: await bcrypt.hash('organizer123', 10),
        role: UserRole.ORGANIZER,
        verificationStatus: VerificationStatus.PENDING,
        adminApprovalStatus: AdminApprovalStatus.PENDING,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        OrganizerProfile: {
          create: {
            companyName: 'New Events Company',
            bio: 'Newly established event management company.',
            location: 'Garissa',
            phoneNumber: '+254712345013',
            eventTypes: ['General Events'],
            totalEvents: 0,
          }
        }
      },
    });

    // Inactive organizer
    const inactiveOrganizer = await prisma.user.create({
      data: {
        name: 'Inactive Organizer',
        email: 'inactive.organizer@test.com',
        password: await bcrypt.hash('organizer123', 10),
        role: UserRole.ORGANIZER,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: false,
        isEmailVerified: true,
        emailVerified: new Date(),
        OrganizerProfile: {
          create: {
            bio: 'Temporarily inactive event organizer.',
            location: 'Kakamega',
            phoneNumber: '+254712345014',
            eventTypes: ['Various Events'],
            totalEvents: 12,
            averageRating: 4.2,
          }
        }
      },
    });

    // Create additional packages
    await prisma.package.create({
      data: {
        talentId: talent5.TalentProfile!.id,
        title: 'Event Decoration & Setup',
        description: 'Complete event decoration and setup service including theme development, floral arrangements, and lighting design.',
        category: 'Decoration & Design',
        location: 'Eldoret',
        price: 55000,
        duration: '8 hours',
        features: ['Theme development', 'Floral arrangements', 'Lighting design', 'Table decorations', 'Setup and breakdown'],
        coverImageUrl: 'https://www.reveriesocial.com/wp-content/uploads/2024/01/2024-EVENT-TRENDS-HERO.webp',
        images: ['https://images.pexels.com/photos/26673721/pexels-photo-26673721.jpeg?cs=srgb&dl=pexels-mibernaa-26673721.jpg&fm=jpg', 'https://curatedevents.com/wp-content/uploads/2025/02/aa2a92e5-7729-455b-94bb-c9c9519b2cf6-scaled-1.webp'],
        isPublished: true,
        isActive: true,
        viewCount: 32,
        inquiryCount: 8,
        bookingCount: 5,
      },
    });

    await prisma.package.create({
      data: {
        talentId: talent6.TalentProfile!.id,
        title: 'Event Security Service',
        description: 'Professional security service for events including trained personnel, crowd control, and emergency response capabilities.',
        category: 'Security & Safety',
        location: 'Nairobi',
        price: 25000,
        duration: '8 hours',
        features: ['Trained security personnel', 'Crowd control', 'Emergency response', 'VIP protection', '24/7 monitoring'],
        coverImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Seal_of_U.S._Department_of_State_Diplomatic_Security.svg/1200px-Seal_of_U.S._Department_of_State_Diplomatic_Security.svg.png',
        images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/UN_security_COP26.jpg/960px-UN_security_COP26.jpg', 'https://upload.wikimedia.org/wikipedia/commons/6/6a/UN_security_COP26.jpg'],
        isPublished: true,
        isActive: true,
        viewCount: 28,
        inquiryCount: 6,
        bookingCount: 4,
      },
    });

    console.log('✅ Additional accounts created successfully!');
    console.log('');
    console.log('📋 ADDITIONAL TEST ACCOUNTS:');
    console.log('=' .repeat(50));
    console.log('');

    console.log('🎭 ADDITIONAL TALENT ACCOUNTS:');
    console.log('-'.repeat(30));
    console.log('Email: david.decor@test.com');
    console.log('Password: talent123');
    console.log('Name: David Decorator');
    console.log('Category: Decoration & Design');
    console.log('Location: Eldoret');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: james.security@test.com');
    console.log('Password: talent123');
    console.log('Name: James Security');
    console.log('Category: Security & Safety');
    console.log('Location: Nairobi');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: unverified.talent@test.com');
    console.log('Password: talent123');
    console.log('Name: Unverified Talent');
    console.log('Category: Transportation');
    console.log('Location: Kitale');
    console.log('Status: PENDING | UNVERIFIED | Active | Email NOT Verified');
    console.log('');

    console.log('🏢 ADDITIONAL ORGANIZER ACCOUNTS:');
    console.log('-'.repeat(30));
    console.log('Email: john.organizer@test.com');
    console.log('Password: organizer123');
    console.log('Name: John Personal Organizer');
    console.log('Company: Individual');
    console.log('Location: Kisumu');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: pending.organizer@test.com');
    console.log('Password: organizer123');
    console.log('Name: Pending Organizer');
    console.log('Company: New Events Company');
    console.log('Location: Garissa');
    console.log('Status: PENDING | PENDING | Active');
    console.log('');
    console.log('Email: inactive.organizer@test.com');
    console.log('Password: organizer123');
    console.log('Name: Inactive Organizer');
    console.log('Company: Individual');
    console.log('Location: Kakamega');
    console.log('Status: APPROVED | VERIFIED | INACTIVE');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating additional accounts:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Additional seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
