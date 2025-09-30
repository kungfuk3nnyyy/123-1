
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DATABASE STATE CHECK ===');
    
    // Check users
    const users = await prisma.user.findMany({
      include: {
        talentProfile: true,
        organizerProfile: true
      }
    });
    console.log(`\n👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check events
    const events = await prisma.event.findMany({
      include: {
        organizer: true
      }
    });
    console.log(`\n📅 Events: ${events.length}`);
    events.forEach(event => {
      console.log(`  - ${event.title} - Budget: KES ${event.budget} - Date: ${event.eventDate}`);
    });
    
    // Check bookings
    const bookings = await prisma.booking.findMany({
      include: {
        event: true,
        talent: true,
        organizer: true
      }
    });
    console.log(`\n📋 Bookings: ${bookings.length}`);
    bookings.forEach(booking => {
      console.log(`  - Event: ${booking.event.title} - Status: ${booking.status} - Amount: KES ${booking.amount}`);
    });
    
    // Check talent profiles
    const talents = await prisma.talentProfile.findMany({
      include: {
        user: true
      }
    });
    console.log(`\n🎭 Talent Profiles: ${talents.length}`);
    talents.forEach(talent => {
      console.log(`  - ${talent.user.name} - Category: ${talent.category} - Rate: KES ${talent.hourlyRate}/hr`);
    });
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
