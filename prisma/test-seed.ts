import { PrismaClient, UserRole, VerificationStatus, AdminApprovalStatus, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting comprehensive seed process...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.$transaction([
      prisma.booking.deleteMany({}),
      prisma.proposal.deleteMany({}),
      prisma.event.deleteMany({}),
      prisma.package.deleteMany({}),
      prisma.talentProfile.deleteMany({}),
      prisma.organizerProfile.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared');

    // Create Admin Users
    console.log('👑 Creating Admin Users...');
    
    const admin1 = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@gigsec.com',
        password: await bcrypt.hash('admin123', 10),
        role: UserRole.ADMIN,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
      },
    });

    const admin2 = await prisma.user.create({
      data: {
        name: 'Platform Manager',
        email: 'manager@gigsec.com',
        password: await bcrypt.hash('manager123', 10),
        role: UserRole.ADMIN,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Created admin accounts');

    // Create Talent Users
    console.log('🎭 Creating Talent Users...');

    const talent1 = await prisma.user.create({
      data: {
        name: 'Alex Musician',
        email: 'alex.musician@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'Professional musician with 8+ years of experience in live performances, studio recordings, and event entertainment.',
            tagline: 'Bringing your events to life with soulful music',
            category: 'Music & Entertainment',
            location: 'Nairobi',
            skills: ['Guitar', 'Piano', 'Vocals', 'Live Performance', 'Studio Recording'],
            experience: '8+ years',
            hourlyRate: 5000,
            averageRating: 4.8,
            totalReviews: 24,
            totalBookings: 45,
            phoneNumber: '+254712345001',
            website: 'https://alexmusician.com',
            mpesaPhoneNumber: '+254712345001',
            mpesaVerified: true,
          }
        }
      },
      include: {
        TalentProfile: true,
      },
    });

    const talent2 = await prisma.user.create({
      data: {
        name: 'Sarah Photography',
        email: 'sarah.photo@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'Award-winning photographer specializing in weddings, corporate events, and portrait photography with a creative eye for detail.',
            tagline: 'Capturing your precious moments with artistic vision',
            category: 'Photography & Videography',
            location: 'Mombasa',
            skills: ['Wedding Photography', 'Event Photography', 'Portrait Photography', 'Photo Editing', 'Drone Photography'],
            experience: '6+ years',
            hourlyRate: 8000,
            averageRating: 4.9,
            totalReviews: 32,
            totalBookings: 67,
            phoneNumber: '+254712345002',
            website: 'https://sarahphotography.co.ke',
            mpesaPhoneNumber: '+254712345002',
            mpesaVerified: true,
          }
        }
      },
      include: {
        TalentProfile: true,
      },
    });

    const talent3 = await prisma.user.create({
      data: {
        name: 'Mike Event Planner',
        email: 'mike.events@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'Experienced event planner specializing in corporate events, weddings, and private celebrations with attention to every detail.',
            tagline: 'Making your dream events a reality',
            category: 'Event Planning',
            location: 'Kisumu',
            skills: ['Event Coordination', 'Vendor Management', 'Budget Planning', 'Timeline Management', 'Venue Selection'],
            experience: '10+ years',
            hourlyRate: 6000,
            averageRating: 4.7,
            totalReviews: 18,
            totalBookings: 34,
            phoneNumber: '+254712345003',
            website: 'https://mikeevents.co.ke',
            mpesaPhoneNumber: '+254712345003',
            mpesaVerified: true,
          }
        }
      },
      include: {
        TalentProfile: true,
      },
    });

    const talent4 = await prisma.user.create({
      data: {
        name: 'Grace Catering',
        email: 'grace.catering@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'Professional caterer offering both local Kenyan cuisine and international dishes for all types of events and celebrations.',
            tagline: 'Delicious food that brings people together',
            category: 'Catering & Food',
            location: 'Nakuru',
            skills: ['Kenyan Cuisine', 'International Cuisine', 'Event Catering', 'Menu Planning', 'Food Safety'],
            experience: '12+ years',
            hourlyRate: 4500,
            averageRating: 4.8,
            totalReviews: 41,
            totalBookings: 89,
            phoneNumber: '+254712345004',
            mpesaPhoneNumber: '+254712345004',
            mpesaVerified: true,
          }
        }
      },
      include: {
        TalentProfile: true,
      },
    });

    // Talent with different statuses
    const pendingTalent = await prisma.user.create({
      data: {
        name: 'Pending Talent',
        email: 'pending.talent@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.PENDING,
        adminApprovalStatus: AdminApprovalStatus.PENDING,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'New DJ looking to provide entertainment services for events.',
            tagline: 'Fresh beats for your events',
            category: 'Music & Entertainment',
            location: 'Thika',
            skills: ['DJ Services', 'Music Mixing', 'Sound System'],
            experience: '2+ years',
            hourlyRate: 3500,
            phoneNumber: '+254712345007',
            mpesaPhoneNumber: '+254712345007',
            mpesaVerified: false,
          }
        }
      },
    });

    const rejectedTalent = await prisma.user.create({
      data: {
        name: 'Rejected Talent',
        email: 'rejected.talent@test.com',
        password: await bcrypt.hash('talent123', 10),
        role: UserRole.TALENT,
        verificationStatus: VerificationStatus.REJECTED,
        adminApprovalStatus: AdminApprovalStatus.REJECTED,
        isActive: false,
        isEmailVerified: true,
        emailVerified: new Date(),
        TalentProfile: {
          create: {
            bio: 'Videographer with basic equipment.',
            tagline: 'Basic video services',
            category: 'Photography & Videography',
            location: 'Malindi',
            skills: ['Basic Videography'],
            experience: '1 year',
            hourlyRate: 2000,
            phoneNumber: '+254712345008',
          }
        }
      },
    });

    console.log('✅ Created talent accounts');

    // Create Organizer Users
    console.log('🏢 Creating Organizer Users...');

    const organizer1 = await prisma.user.create({
      data: {
        name: 'Corporate Events Kenya',
        email: 'corporate@eventskenya.com',
        password: await bcrypt.hash('organizer123', 10),
        role: UserRole.ORGANIZER,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        OrganizerProfile: {
          create: {
            companyName: 'Corporate Events Kenya Ltd',
            bio: 'Leading corporate event management company in Kenya, specializing in conferences, seminars, and corporate celebrations.',
            location: 'Nairobi',
            website: 'https://corporateeventskenya.com',
            phoneNumber: '+254712345010',
            eventTypes: ['Corporate Events', 'Conferences', 'Seminars', 'Product Launches'],
            totalEvents: 45,
            averageRating: 4.7,
          }
        }
      },
    });

    const organizer2 = await prisma.user.create({
      data: {
        name: 'Coastal Weddings',
        email: 'info@coastalweddings.co.ke',
        password: await bcrypt.hash('organizer123', 10),
        role: UserRole.ORGANIZER,
        verificationStatus: VerificationStatus.VERIFIED,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        isActive: true,
        isEmailVerified: true,
        emailVerified: new Date(),
        OrganizerProfile: {
          create: {
            companyName: 'Coastal Weddings & Events',
            bio: 'Mombasa-based wedding and event organizers specializing in beach weddings and destination events.',
            location: 'Mombasa',
            website: 'https://coastalweddings.co.ke',
            phoneNumber: '+254712345011',
            eventTypes: ['Weddings', 'Beach Events', 'Destination Events', 'Private Parties'],
            totalEvents: 67,
            averageRating: 4.9,
          }
        }
      },
    });

    console.log('✅ Created organizer accounts');

    // Create Packages
    console.log('📦 Creating Packages...');

    await prisma.package.create({
      data: {
        talentId: talent1.TalentProfile!.id,
        title: 'Wedding Music Package',
        description: 'Complete music entertainment for your wedding ceremony and reception including sound system, microphones, and playlist customization.',
        category: 'Music & Entertainment',
        location: 'Nairobi',
        price: 35000,
        duration: '6 hours',
        features: ['Professional sound system', 'Wireless microphones', 'Custom playlist', 'MC services', '6-hour performance'],
        coverImageUrl: 'https://static.wixstatic.com/media/c28ff8_05342b0daf6b456588d18c2f44dced95~mv2.jpg/v1/fill/w_640,h_428,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/c28ff8_05342b0daf6b456588d18c2f44dced95~mv2.jpg',
        images: ['https://i.ytimg.com/vi/Avaa4_702eM/sddefault.jpg', 'https://i.pinimg.com/736x/47/c3/d4/47c3d4e9d57f674ff91ad09d47d80102.jpg'],
        isPublished: true,
        isActive: true,
        viewCount: 45,
        inquiryCount: 12,
        bookingCount: 8,
      },
    });

    await prisma.package.create({
      data: {
        talentId: talent2.TalentProfile!.id,
        title: 'Corporate Event Photography',
        description: 'Professional photography coverage for corporate events, conferences, and business gatherings with same-day preview.',
        category: 'Photography & Videography',
        location: 'Mombasa',
        price: 45000,
        duration: '8 hours',
        features: ['Professional photographer', 'High-resolution images', 'Same-day preview', 'Online gallery', 'Print-ready files'],
        coverImageUrl: 'https://images.unsplash.com/photo-1560564029-6eb181a872c4?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW9tYmFzYXxlbnwwfHwwfHx8MA%3D%3D',
        images: ['https://silvergumtype.com/wp-content/uploads/2024/04/james-nader-portfolio.jpg', 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?cs=srgb&dl=pexels-andre-furtado-43594-1264210.jpg&fm=jpg'],
        isPublished: true,
        isActive: true,
        viewCount: 67,
        inquiryCount: 18,
        bookingCount: 12,
      },
    });

    console.log('✅ Created packages');

    // Create Events
    console.log('📅 Creating Events...');

    await prisma.event.create({
      data: {
        organizerId: organizer1.id,
        title: 'Annual Corporate Gala 2025',
        description: 'Join us for an elegant evening of networking, awards, and celebration at our annual corporate gala featuring keynote speakers and entertainment.',
        category: ['Event Planning', 'Catering & Food', 'Music & Entertainment', 'Decoration & Design'],
        location: 'Nairobi',
        eventDate: new Date('2025-11-15T19:00:00'),
        duration: 300,
        requirements: 'Professional attire required. Must have experience with corporate events and ability to handle 200+ guests.',
        budgetMin: 150000,
        budgetMax: 300000,
        status: EventStatus.PUBLISHED,
        isPublic: true,
        isActive: true,
      },
    });

    await prisma.event.create({
      data: {
        organizerId: organizer2.id,
        title: 'Beach Wedding Ceremony',
        description: 'Romantic beach wedding ceremony and reception for 150 guests with ocean views, requiring coordination of multiple vendors.',
        category: ['Decoration & Design', 'Photography & Videography', 'Catering & Food', 'Music & Entertainment'],
        location: 'Mombasa',
        eventDate: new Date('2025-12-10T15:00:00'),
        duration: 480,
        requirements: 'Experience with beach/outdoor events essential. Must coordinate with multiple vendors and handle weather contingencies.',
        budgetMin: 250000,
        budgetMax: 500000,
        status: EventStatus.PUBLISHED,
        isPublic: true,
        isActive: true,
      },
    });

    console.log('✅ Created events');

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('📋 TEST ACCOUNT CREDENTIALS:');
    console.log('=' .repeat(80));
    console.log('');

    console.log('🔐 ADMIN ACCOUNTS:');
    console.log('-'.repeat(40));
    console.log('Email: admin@gigsec.com');
    console.log('Password: admin123');
    console.log('Name: Super Admin');
    console.log('Status: APPROVED | VERIFIED');
    console.log('');
    console.log('Email: manager@gigsec.com');
    console.log('Password: manager123');
    console.log('Name: Platform Manager');
    console.log('Status: APPROVED | VERIFIED');
    console.log('');

    console.log('🎭 TALENT ACCOUNTS:');
    console.log('-'.repeat(40));
    console.log('Email: alex.musician@test.com');
    console.log('Password: talent123');
    console.log('Name: Alex Musician');
    console.log('Category: Music & Entertainment');
    console.log('Location: Nairobi');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: sarah.photo@test.com');
    console.log('Password: talent123');
    console.log('Name: Sarah Photography');
    console.log('Category: Photography & Videography');
    console.log('Location: Mombasa');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: mike.events@test.com');
    console.log('Password: talent123');
    console.log('Name: Mike Event Planner');
    console.log('Category: Event Planning');
    console.log('Location: Kisumu');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: grace.catering@test.com');
    console.log('Password: talent123');
    console.log('Name: Grace Catering');
    console.log('Category: Catering & Food');
    console.log('Location: Nakuru');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: pending.talent@test.com');
    console.log('Password: talent123');
    console.log('Name: Pending Talent');
    console.log('Category: Music & Entertainment');
    console.log('Location: Thika');
    console.log('Status: PENDING | PENDING | Active');
    console.log('');
    console.log('Email: rejected.talent@test.com');
    console.log('Password: talent123');
    console.log('Name: Rejected Talent');
    console.log('Category: Photography & Videography');
    console.log('Location: Malindi');
    console.log('Status: REJECTED | REJECTED | Inactive');
    console.log('');

    console.log('🏢 ORGANIZER ACCOUNTS:');
    console.log('-'.repeat(40));
    console.log('Email: corporate@eventskenya.com');
    console.log('Password: organizer123');
    console.log('Name: Corporate Events Kenya');
    console.log('Company: Corporate Events Kenya Ltd');
    console.log('Location: Nairobi');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');
    console.log('Email: info@coastalweddings.co.ke');
    console.log('Password: organizer123');
    console.log('Name: Coastal Weddings');
    console.log('Company: Coastal Weddings & Events');
    console.log('Location: Mombasa');
    console.log('Status: APPROVED | VERIFIED | Active');
    console.log('');

    console.log('=' .repeat(80));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log('Total Users Created: 8');
    console.log('- Admins: 2');
    console.log('- Talents: 4 (2 approved, 1 pending, 1 rejected)');
    console.log('- Organizers: 2');
    console.log('Packages Created: 2');
    console.log('Events Created: 2');
    console.log('');
    console.log('🎯 Test Coverage:');
    console.log('- Different user roles (Admin, Talent, Organizer)');
    console.log('- Various approval statuses (Pending, Approved, Rejected)');
    console.log('- Different verification states (Verified, Pending, Rejected)');
    console.log('- Active and inactive accounts');
    console.log('- Multiple talent categories and locations');
    console.log('- Sample packages and events for testing');
    console.log('');
    console.log('✨ Ready for comprehensive testing!');

  } catch (error) {
    console.error('❌ Error during seed process:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
