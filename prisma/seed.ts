
import { PrismaClient, UserRole, EventStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Categories and locations from the frontend
const categories = [
  'Music & Entertainment',
  'Photography & Videography',
  'Event Planning',
  'Catering & Food',
  'Decoration & Design',
  'Security & Safety',
  'Transportation',
  'Technical & AV',
  'Marketing & Promotion',
  'Other'
];

// Simple random item picker
const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const locations = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Kakamega'
];

// Sample talent data
const talents = [
  {
    name: 'John Doe',
    email: 'talent1@example.com',
    role: UserRole.TALENT,
    bio: 'Professional musician with 5+ years of experience performing at various events across Kenya.',
    tagline: 'Bringing life to your events with soulful music',
    category: 'Music & Entertainment',
    location: 'Nairobi',
    price: 15000,
    rating: 4.8
  },
  {
    name: 'Jane Smith',
    email: 'talent2@example.com',
    role: UserRole.TALENT,
    bio: 'Award-winning photographer specializing in event coverage and portrait photography.',
    tagline: 'Capturing your special moments perfectly',
    category: 'Photography & Videography',
    location: 'Mombasa',
    price: 25000,
    rating: 4.9
  },
  {
    name: 'Mike Johnson',
    email: 'talent3@example.com',
    role: UserRole.TALENT,
    bio: 'Experienced event planner with a focus on corporate and private events.',
    tagline: 'Making your event planning stress-free',
    category: 'Event Planning',
    location: 'Kisumu',
    price: 30000,
    rating: 4.7
  },
  {
    name: 'Sarah Williams',
    email: 'talent4@example.com',
    role: UserRole.TALENT,
    bio: 'Professional caterer specializing in both local and international cuisines.',
    tagline: 'Delicious food that tells a story',
    category: 'Catering & Food',
    location: 'Nakuru',
    price: 20000,
    rating: 4.8
  },
  {
    name: 'David Kimani',
    email: 'talent5@example.com',
    role: UserRole.TALENT,
    bio: 'Creative event decorator with a passion for unique and memorable designs.',
    tagline: 'Transforming spaces into experiences',
    category: 'Decoration & Design',
    location: 'Eldoret',
    price: 18000,
    rating: 4.6
  }
];

// Sample organizer data
const organizers = [
  {
    name: 'Event Masters Kenya',
    email: 'organizer1@example.com',
    role: UserRole.ORGANIZER,
    bio: 'Leading event management company in Kenya, specializing in corporate and social events.',
    location: 'Nairobi'
  },
  {
    name: 'Coastal Events Ltd',
    email: 'organizer2@example.com',
    role: UserRole.ORGANIZER,
    bio: 'Mombasa-based event organizers with a focus on beach and destination events.',
    location: 'Mombasa'
  },
  {
    name: 'Lakeview Events',
    email: 'organizer3@example.com',
    role: UserRole.ORGANIZER,
    bio: 'Kisumu\'s premier event planning company for weddings and social gatherings.',
    location: 'Kisumu'
  }
];

// Admin user data
const adminUser = {
  name: 'Super Admin',
  email: 'admin@example.com',
  role: UserRole.ADMIN
};

// Sample events data
const events = [
  {
    title: 'Annual Corporate Gala',
    description: 'Join us for an evening of networking and celebration at our annual corporate gala.',
    categories: ['Event Planning', 'Catering & Food', 'Music & Entertainment'],
    location: 'Nairobi',
    eventDate: new Date('2025-11-15T19:00:00'),
    budgetMin: 50000,
    budgetMax: 100000,
    status: EventStatus.PUBLISHED
  },
  {
    title: 'Beach Wedding',
    description: 'Romantic beach wedding ceremony and reception with ocean views.',
    categories: ['Decoration & Design', 'Photography & Videography', 'Catering & Food'],
    location: 'Mombasa',
    eventDate: new Date('2025-12-10T15:00:00'),
    budgetMin: 150000,
    budgetMax: 300000,
    status: EventStatus.PUBLISHED
  },
  {
    title: 'Tech Conference 2025',
    description: 'Annual technology conference featuring industry leaders and innovators.',
    categories: ['Technical & AV', 'Marketing & Promotion', 'Event Planning'],
    location: 'Nairobi',
    eventDate: new Date('2025-10-20T09:00:00'),
    budgetMin: 100000,
    budgetMax: 250000,
    status: EventStatus.PUBLISHED
  },
  {
    title: 'Music Festival',
    description: 'Weekend music festival featuring local and international artists.',
    categories: ['Music & Entertainment', 'Security & Safety', 'Transportation'],
    location: 'Nakuru',
    eventDate: new Date('2025-11-25T12:00:00'),
    budgetMin: 500000,
    budgetMax: 1000000,
    status: EventStatus.PUBLISHED
  },
  {
    title: 'Charity Fundraiser',
    description: 'Gala dinner and auction to raise funds for local community projects.',
    categories: ['Event Planning', 'Catering & Food', 'Decoration & Design'],
    location: 'Kisumu',
    eventDate: new Date('2025-12-05T18:30:00'),
    budgetMin: 250000,
    budgetMax: 500000,
    status: EventStatus.PUBLISHED
  }
];

async function main() {
  console.log('Starting seed process...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.$transaction([
    prisma.booking.deleteMany({}),
    prisma.proposal.deleteMany({}),
    prisma.event.deleteMany({}),
    prisma.package.deleteMany({}),
    prisma.talentProfile.deleteMany({}),
    prisma.user.deleteMany({ where: { role: { in: [UserRole.TALENT, UserRole.ORGANIZER, UserRole.ADMIN] } } }),
  ]);

  console.log('Creating admin user...');
  // Create admin user with secure password hashing
  const adminHashedPassword = await bcrypt.hash('superadminpassword', 12);
  await prisma.user.create({
    data: {
      name: adminUser.name,
      email: adminUser.email,
      password: adminHashedPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      isEmailVerified: true,
      isActive: true,
      adminApprovalStatus: 'APPROVED',
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  console.log('Creating users and talents...');
  const createdTalents = [];
  
  for (const talent of talents) {
    // Use secure bcrypt hashing with salt rounds of 12
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        name: talent.name,
        email: talent.email,
        password: hashedPassword,
        role: UserRole.TALENT,
        emailVerified: new Date(),
        isEmailVerified: true,
        isActive: true,
        verificationStatus: VerificationStatus.VERIFIED,
        TalentProfile: {
          create: {
            bio: talent.bio,
            tagline: talent.tagline,
            category: talent.category,
            location: talent.location,
            averageRating: talent.rating,
          },
        },
      },
      include: {
        TalentProfile: true,
      },
    });

    // Create packages for each talent
    await prisma.package.create({
      data: {
        talentId: user.TalentProfile!.id,
        title: `${talent.category} Package`,
        description: `Professional ${talent.category.toLowerCase()} services for your event.`,
        category: talent.category,
        location: talent.location,
        price: talent.price,
        duration: '4 hours',
        features: [
          'Professional service',
          'High-quality equipment',
          'Setup and teardown',
          'Travel within city limits'
        ],
        coverImageUrl: `https://images.unsplash.com/photo-1493612276216-ee3925520721?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmFuZG9tfGVufDB8fDB8fHww * 1000)}`,
        images: [
          `https://i.ytimg.com/vi/u45pHKmTPE8/maxresdefault.jpg * 1000)}`,
          `https://i.ytimg.com/vi/UPhB_VWjRzE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDcGVgI647BW6H2GyqEaDZTBcXg2g * 1000)}`,
          `https://upload.wikimedia.org/wikipedia/commons/1/18/Temporary_placeholder_photo.jpg * 1000)}`
        ],
        isPublished: true,
        isActive: true,
      },
    });

    createdTalents.push(user);
  }

  console.log('Creating organizers and events...');
  const createdOrganizers = [];
  
  for (const organizer of organizers) {
    // Use secure bcrypt hashing with salt rounds of 12
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        name: organizer.name,
        email: organizer.email,
        password: hashedPassword,
        role: UserRole.ORGANIZER,
        emailVerified: new Date(),
        isEmailVerified: true,
        isActive: true,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
    createdOrganizers.push(user);
  }

  // Create events
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const organizer = createdOrganizers[i % createdOrganizers.length];
    
    await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: event.title,
        description: event.description,
        category: event.categories,
        location: event.location,
        eventDate: event.eventDate,
        duration: 240, // 4 hours
        requirements: 'Please bring your own equipment if specialized for your service.',
        budgetMin: event.budgetMin,
        budgetMax: event.budgetMax,
        status: event.status,
        isPublic: true,
        isActive: true,
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('Created users with secure bcrypt password hashing:');
  console.log('- Admin: admin@example.com (password: superadminpassword)');
  console.log('- Talent: talent1@example.com (password: password123)');
  console.log('- Organizer: organizer1@example.com (password: password123)');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
