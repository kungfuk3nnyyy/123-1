
import { PrismaClient, UserRole, VerificationStatus, AdminApprovalStatus, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Test account data structure
interface TestAccount {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  verificationStatus?: VerificationStatus;
  adminApprovalStatus?: AdminApprovalStatus;
  isActive?: boolean;
  isEmailVerified?: boolean;
  profileData?: any;
}

// Comprehensive test accounts covering all scenarios
const testAccounts: TestAccount[] = [
  // ADMIN USERS
  {
    name: 'Super Admin',
    email: 'admin@gigsec.com',
    password: 'admin123',
    role: UserRole.ADMIN,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
  },
  {
    name: 'Platform Manager',
    email: 'manager@gigsec.com',
    password: 'manager123',
    role: UserRole.ADMIN,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
  },

  // TALENT USERS - Various categories and statuses
  {
    name: 'Alex Musician',
    email: 'alex.musician@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
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
  },
  {
    name: 'Sarah Photography',
    email: 'sarah.photo@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
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
  },
  {
    name: 'Mike Event Planner',
    email: 'mike.events@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
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
  },
  {
    name: 'Grace Catering',
    email: 'grace.catering@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
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
  },
  {
    name: 'David Decorator',
    email: 'david.decor@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
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
  },
  {
    name: 'James Security',
    email: 'james.security@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
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
  },

  // TALENT USERS - Different statuses for testing
  {
    name: 'Pending Talent',
    email: 'pending.talent@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.PENDING,
    adminApprovalStatus: AdminApprovalStatus.PENDING,
    isActive: true,
    isEmailVerified: true,
    profileData: {
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
  },
  {
    name: 'Rejected Talent',
    email: 'rejected.talent@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.REJECTED,
    adminApprovalStatus: AdminApprovalStatus.REJECTED,
    isActive: false,
    isEmailVerified: true,
    profileData: {
      bio: 'Videographer with basic equipment.',
      tagline: 'Basic video services',
      category: 'Photography & Videography',
      location: 'Malindi',
      skills: ['Basic Videography'],
      experience: '1 year',
      hourlyRate: 2000,
      phoneNumber: '+254712345008',
    }
  },
  {
    name: 'Unverified Talent',
    email: 'unverified.talent@test.com',
    password: 'talent123',
    role: UserRole.TALENT,
    verificationStatus: VerificationStatus.UNVERIFIED,
    adminApprovalStatus: AdminApprovalStatus.PENDING,
    isActive: true,
    isEmailVerified: false,
    profileData: {
      bio: 'Transportation service provider for events.',
      tagline: 'Reliable transport solutions',
      category: 'Transportation',
      location: 'Kitale',
      skills: ['Event Transportation', 'Logistics'],
      experience: '3+ years',
      hourlyRate: 2500,
      phoneNumber: '+254712345009',
    }
  },

  // ORGANIZER USERS
  {
    name: 'Corporate Events Kenya',
    email: 'corporate@eventskenya.com',
    password: 'organizer123',
    role: UserRole.ORGANIZER,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
      companyName: 'Corporate Events Kenya Ltd',
      bio: 'Leading corporate event management company in Kenya, specializing in conferences, seminars, and corporate celebrations.',
      location: 'Nairobi',
      website: 'https://corporateeventskenya.com',
      phoneNumber: '+254712345010',
      eventTypes: ['Corporate Events', 'Conferences', 'Seminars', 'Product Launches'],
      totalEvents: 45,
      averageRating: 4.7,
    }
  },
  {
    name: 'Coastal Weddings',
    email: 'info@coastalweddings.co.ke',
    password: 'organizer123',
    role: UserRole.ORGANIZER,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
      companyName: 'Coastal Weddings & Events',
      bio: 'Mombasa-based wedding and event organizers specializing in beach weddings and destination events.',
      location: 'Mombasa',
      website: 'https://coastalweddings.co.ke',
      phoneNumber: '+254712345011',
      eventTypes: ['Weddings', 'Beach Events', 'Destination Events', 'Private Parties'],
      totalEvents: 67,
      averageRating: 4.9,
    }
  },
  {
    name: 'John Personal Organizer',
    email: 'john.organizer@test.com',
    password: 'organizer123',
    role: UserRole.ORGANIZER,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: true,
    isEmailVerified: true,
    profileData: {
      bio: 'Individual event organizer specializing in private parties and small gatherings.',
      location: 'Kisumu',
      phoneNumber: '+254712345012',
      eventTypes: ['Private Parties', 'Birthday Parties', 'Small Gatherings'],
      totalEvents: 23,
      averageRating: 4.5,
    }
  },

  // ORGANIZER USERS - Different statuses
  {
    name: 'Pending Organizer',
    email: 'pending.organizer@test.com',
    password: 'organizer123',
    role: UserRole.ORGANIZER,
    verificationStatus: VerificationStatus.PENDING,
    adminApprovalStatus: AdminApprovalStatus.PENDING,
    isActive: true,
    isEmailVerified: true,
    profileData: {
      companyName: 'New Events Company',
      bio: 'Newly established event management company.',
      location: 'Garissa',
      phoneNumber: '+254712345013',
      eventTypes: ['General Events'],
      totalEvents: 0,
    }
  },
  {
    name: 'Inactive Organizer',
    email: 'inactive.organizer@test.com',
    password: 'organizer123',
    role: UserRole.ORGANIZER,
    verificationStatus: VerificationStatus.VERIFIED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
    isActive: false,
    isEmailVerified: true,
    profileData: {
      bio: 'Temporarily inactive event organizer.',
      location: 'Kakamega',
      phoneNumber: '+254712345014',
      eventTypes: ['Various Events'],
      totalEvents: 12,
      averageRating: 4.2,
    }
  },
];

// Sample packages for talents
const samplePackages = [
  {
    title: 'Wedding Music Package',
    description: 'Complete music entertainment for your wedding ceremony and reception including sound system, microphones, and playlist customization.',
    features: ['Professional sound system', 'Wireless microphones', 'Custom playlist', 'MC services', '6-hour performance'],
    duration: '6 hours',
    price: 35000,
  },
  {
    title: 'Corporate Event Photography',
    description: 'Professional photography coverage for corporate events, conferences, and business gatherings with same-day preview.',
    features: ['Professional photographer', 'High-resolution images', 'Same-day preview', 'Online gallery', 'Print-ready files'],
    duration: '8 hours',
    price: 45000,
  },
  {
    title: 'Full Event Planning Service',
    description: 'Complete event planning from concept to execution including vendor coordination, timeline management, and on-site supervision.',
    features: ['Event concept development', 'Vendor coordination', 'Timeline management', 'Budget planning', 'On-site supervision'],
    duration: 'Full service',
    price: 75000,
  },
  {
    title: 'Catering Package - 100 Guests',
    description: 'Complete catering service for 100 guests including appetizers, main course, dessert, and beverages with professional service staff.',
    features: ['3-course meal', 'Professional service staff', 'Table setup', 'Cleanup service', 'Dietary accommodations'],
    duration: '6 hours',
    price: 85000,
  },
  {
    title: 'Event Decoration & Setup',
    description: 'Complete event decoration and setup service including theme development, floral arrangements, and lighting design.',
    features: ['Theme development', 'Floral arrangements', 'Lighting design', 'Table decorations', 'Setup and breakdown'],
    duration: '8 hours',
    price: 55000,
  },
  {
    title: 'Event Security Service',
    description: 'Professional security service for events including trained personnel, crowd control, and emergency response capabilities.',
    features: ['Trained security personnel', 'Crowd control', 'Emergency response', 'VIP protection', '24/7 monitoring'],
    duration: '8 hours',
    price: 25000,
  },
];

// Sample events for organizers
const sampleEvents = [
  {
    title: 'Annual Corporate Gala 2025',
    description: 'Join us for an elegant evening of networking, awards, and celebration at our annual corporate gala featuring keynote speakers and entertainment.',
    categories: ['Event Planning', 'Catering & Food', 'Music & Entertainment', 'Decoration & Design'],
    location: 'Nairobi',
    eventDate: new Date('2025-11-15T19:00:00'),
    duration: 300, // 5 hours
    requirements: 'Professional attire required. Must have experience with corporate events and ability to handle 200+ guests.',
    budgetMin: 150000,
    budgetMax: 300000,
    status: EventStatus.PUBLISHED,
  },
  {
    title: 'Beach Wedding Ceremony',
    description: 'Romantic beach wedding ceremony and reception for 150 guests with ocean views, requiring coordination of multiple vendors.',
    categories: ['Decoration & Design', 'Photography & Videography', 'Catering & Food', 'Music & Entertainment'],
    location: 'Mombasa',
    eventDate: new Date('2025-12-10T15:00:00'),
    duration: 480, // 8 hours
    requirements: 'Experience with beach/outdoor events essential. Must coordinate with multiple vendors and handle weather contingencies.',
    budgetMin: 250000,
    budgetMax: 500000,
    status: EventStatus.PUBLISHED,
  },
  {
    title: 'Tech Innovation Conference 2025',
    description: 'Two-day technology conference featuring industry leaders, startup pitches, and networking sessions for 300+ attendees.',
    categories: ['Technical & AV', 'Event Planning', 'Catering & Food', 'Security & Safety'],
    location: 'Nairobi',
    eventDate: new Date('2025-10-20T09:00:00'),
    duration: 960, // 16 hours (2 days)
    requirements: 'Experience with large conferences required. Must handle AV equipment, multiple speakers, and technical requirements.',
    budgetMin: 400000,
    budgetMax: 800000,
    status: EventStatus.PUBLISHED,
  },
  {
    title: 'Music Festival Weekend',
    description: 'Three-day music festival featuring local and international artists, food vendors, and entertainment for 1000+ attendees.',
    categories: ['Music & Entertainment', 'Security & Safety', 'Transportation', 'Technical & AV'],
    location: 'Nakuru',
    eventDate: new Date('2025-11-25T12:00:00'),
    duration: 2160, // 36 hours (3 days)
    requirements: 'Large-scale event experience mandatory. Must coordinate with multiple artists, security, and logistics teams.',
    budgetMin: 800000,
    budgetMax: 1500000,
    status: EventStatus.PUBLISHED,
  },
  {
    title: 'Charity Fundraising Gala',
    description: 'Elegant charity gala dinner and auction to raise funds for local community projects, featuring guest speakers and live entertainment.',
    categories: ['Event Planning', 'Catering & Food', 'Decoration & Design', 'Music & Entertainment'],
    location: 'Kisumu',
    eventDate: new Date('2025-12-05T18:30:00'),
    duration: 360, // 6 hours
    requirements: 'Experience with fundraising events preferred. Must coordinate auction items, speakers, and entertainment seamlessly.',
    budgetMin: 200000,
    budgetMax: 400000,
    status: EventStatus.PUBLISHED,
  },
];

async function main() {
  console.log('🚀 Starting comprehensive seed process...');
  console.log('');

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
    console.log('');

    // Create test accounts
    console.log('👥 Creating test accounts...');
    const createdUsers: any[] = [];
    const createdTalents: any[] = [];
    const createdOrganizers: any[] = [];

    for (const account of testAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const userData: any = {
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        verificationStatus: account.verificationStatus || VerificationStatus.UNVERIFIED,
        adminApprovalStatus: account.adminApprovalStatus || AdminApprovalStatus.PENDING,
        isActive: account.isActive !== undefined ? account.isActive : true,
        isEmailVerified: account.isEmailVerified !== undefined ? account.isEmailVerified : false,
        emailVerified: account.isEmailVerified ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add profile data based on role
      if (account.role === UserRole.TALENT && account.profileData) {
        userData.talentProfile = {
          create: {
            ...account.profileData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        };
      } else if (account.role === UserRole.ORGANIZER && account.profileData) {
        userData.organizerProfile = {
          create: {
            ...account.profileData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        };
      }

      const user = await prisma.user.create({
        data: userData,
        include: {
          TalentProfile: true,
          OrganizerProfile: true,
        },
      });

      createdUsers.push(user);
      
      if (user.role === UserRole.TALENT && user.TalentProfile) {
        createdTalents.push(user);
      } else if (user.role === UserRole.ORGANIZER) {
        createdOrganizers.push(user);
      }

      console.log(`✅ Created ${account.role.toLowerCase()}: ${account.name} (${account.email})`);
    }

    console.log('');
    console.log('📦 Creating packages for talents...');

    // Create packages for approved talents
    const approvedTalents = createdTalents.filter(t => 
      t.adminApprovalStatus === AdminApprovalStatus.APPROVED && 
      t.verificationStatus === VerificationStatus.VERIFIED
    );

    for (let i = 0; i < approvedTalents.length && i < samplePackages.length; i++) {
      const talent = approvedTalents[i];
      const packageData = samplePackages[i];

      await prisma.package.create({
        data: {
          talentId: talent.TalentProfile.id,
          title: packageData.title,
          description: packageData.description,
          category: talent.TalentProfile.category,
          location: talent.TalentProfile.location,
          price: packageData.price,
          duration: packageData.duration,
          features: packageData.features,
          coverImageUrl: `https://i.ytimg.com/vi/UPhB_VWjRzE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDcGVgI647BW6H2GyqEaDZTBcXg2g * 1000)}`,
          images: [
            `https://upload.wikimedia.org/wikipedia/commons/1/18/Temporary_placeholder_photo.jpg * 1000)}`,
            `https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png * 1000)}`,
            `https://i.ytimg.com/vi/vtPI8I2wZRs/sddefault.jpg * 1000)}`
          ],
          isPublished: true,
          isActive: true,
          viewCount: Math.floor(Math.random() * 100),
          inquiryCount: Math.floor(Math.random() * 20),
          bookingCount: Math.floor(Math.random() * 10),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created package: ${packageData.title} for ${talent.name}`);
    }

    console.log('');
    console.log('📅 Creating sample events...');

    // Create events for approved organizers
    const approvedOrganizers = createdOrganizers.filter(o => 
      o.adminApprovalStatus === AdminApprovalStatus.APPROVED && 
      o.isActive
    );

    for (let i = 0; i < sampleEvents.length && i < approvedOrganizers.length; i++) {
      const organizer = approvedOrganizers[i % approvedOrganizers.length];
      const eventData = sampleEvents[i];

      await prisma.event.create({
        data: {
          organizerId: organizer.id,
          title: eventData.title,
          description: eventData.description,
          category: eventData.categories,
          location: eventData.location,
          eventDate: eventData.eventDate,
          duration: eventData.duration,
          requirements: eventData.requirements,
          budgetMin: eventData.budgetMin,
          budgetMax: eventData.budgetMax,
          status: eventData.status,
          isPublic: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created event: ${eventData.title} by ${organizer.name}`);
    }

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('📋 TEST ACCOUNT CREDENTIALS:');
    console.log('=' .repeat(80));
    console.log('');

    // Group accounts by role for better organization
    const adminAccounts = testAccounts.filter(a => a.role === UserRole.ADMIN);
    const talentAccounts = testAccounts.filter(a => a.role === UserRole.TALENT);
    const organizerAccounts = testAccounts.filter(a => a.role === UserRole.ORGANIZER);

    console.log('🔐 ADMIN ACCOUNTS:');
    console.log('-'.repeat(40));
    adminAccounts.forEach(account => {
      console.log(`Email: ${account.email}`);
      console.log(`Password: ${account.password}`);
      console.log(`Name: ${account.name}`);
      console.log(`Status: ${account.adminApprovalStatus} | ${account.verificationStatus}`);
      console.log('');
    });

    console.log('🎭 TALENT ACCOUNTS:');
    console.log('-'.repeat(40));
    talentAccounts.forEach(account => {
      console.log(`Email: ${account.email}`);
      console.log(`Password: ${account.password}`);
      console.log(`Name: ${account.name}`);
      console.log(`Category: ${account.profileData?.category || 'N/A'}`);
      console.log(`Location: ${account.profileData?.location || 'N/A'}`);
      console.log(`Status: ${account.adminApprovalStatus} | ${account.verificationStatus}`);
      console.log(`Active: ${account.isActive} | Email Verified: ${account.isEmailVerified}`);
      console.log('');
    });

    console.log('🏢 ORGANIZER ACCOUNTS:');
    console.log('-'.repeat(40));
    organizerAccounts.forEach(account => {
      console.log(`Email: ${account.email}`);
      console.log(`Password: ${account.password}`);
      console.log(`Name: ${account.name}`);
      console.log(`Company: ${account.profileData?.companyName || 'Individual'}`);
      console.log(`Location: ${account.profileData?.location || 'N/A'}`);
      console.log(`Status: ${account.adminApprovalStatus} | ${account.verificationStatus}`);
      console.log(`Active: ${account.isActive} | Email Verified: ${account.isEmailVerified}`);
      console.log('');
    });

    console.log('=' .repeat(80));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`Total Users Created: ${testAccounts.length}`);
    console.log(`- Admins: ${adminAccounts.length}`);
    console.log(`- Talents: ${talentAccounts.length}`);
    console.log(`- Organizers: ${organizerAccounts.length}`);
    console.log(`Packages Created: ${Math.min(approvedTalents.length, samplePackages.length)}`);
    console.log(`Events Created: ${sampleEvents.length}`);
    console.log('');
    console.log('🎯 Test Coverage:');
    console.log('- Different user roles (Admin, Talent, Organizer)');
    console.log('- Various approval statuses (Pending, Approved, Rejected)');
    console.log('- Different verification states (Unverified, Pending, Verified, Rejected)');
    console.log('- Active and inactive accounts');
    console.log('- Email verified and unverified accounts');
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
