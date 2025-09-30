
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('📊 Database Analysis for Messaging System:');
  console.log('='.repeat(50));
  
  try {
    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    console.log('\n👥 Users:', users.length);
    users.forEach(user => console.log(`  - ${user.name} (${user.role}): ${user.email}`));
    
    // Check bookings
    const bookings = await prisma.booking.findMany({
      select: { 
        id: true, 
        status: true,
        organizerId: true,
        talentId: true,
        event: { select: { title: true } }
      }
    });
    console.log('\n📝 Bookings:', bookings.length);
    bookings.slice(0, 3).forEach(booking => 
      console.log(`  - ${booking.id.substring(0, 8)}: ${booking.event.title} (${booking.status})`)
    );
    
    // Check messages
    const messages = await prisma.message.findMany({
      include: {
        sender: { select: { name: true, role: true } },
        receiver: { select: { name: true, role: true } },
        booking: { select: { event: { select: { title: true } } } }
      }
    });
    console.log('\n💬 Messages:', messages.length);
    
    if (messages.length > 0) {
      messages.slice(0, 5).forEach((msg, i) => {
        console.log(`  ${i+1}. ${msg.sender.name} -> ${msg.receiver.name}`);
        console.log(`     "${msg.content.substring(0, 50)}..."`);
        console.log(`     Read: ${msg.isRead} | Booking: ${msg.booking?.event?.title || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No messages found in database');
    }
    
    // Check for conversation patterns
    const conversations = await prisma.message.groupBy({
      by: ['senderId', 'receiverId', 'bookingId'],
      _count: { id: true }
    });
    console.log('\n🗨️  Unique Conversations:', conversations.length);
    
    // Check if there are sample users for testing
    const organizer = users.find(u => u.role === 'ORGANIZER');
    const talent = users.find(u => u.role === 'TALENT');
    
    if (organizer && talent) {
      console.log('\n✅ Test users available:');
      console.log(`   Organizer: ${organizer.name} (${organizer.email})`);
      console.log(`   Talent: ${talent.name} (${talent.email})`);
      
      // Check if they have bookings together
      const sharedBooking = bookings.find(b => 
        b.organizerId === organizer.id && b.talentId === talent.id
      );
      
      if (sharedBooking) {
        console.log(`   Shared booking: ${sharedBooking.event.title}`);
      } else {
        console.log('   ⚠️  No shared bookings found');
      }
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
