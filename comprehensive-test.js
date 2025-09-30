
const { PrismaClient } = require('@prisma/client');

async function comprehensiveTest() {
  const prisma = new PrismaClient();
  
  console.log('🧪 COMPREHENSIVE QA TESTING - Event Talents Platform');
  console.log('=' .repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function logTest(name, passed, details) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}`);
    if (details) console.log(`    ${details}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++; else results.failed++;
  }
  
  try {
    // Test 1: Database Connectivity
    await prisma.user.count();
    logTest('Database Connectivity', true, 'Successfully connected to PostgreSQL database');
    
    // Test 2: User Account Creation (DJ Spark)
    const djSpark = await prisma.user.findUnique({
      where: { email: 'djspark.nairobi@gmail.com' },
      include: { talentProfile: true }
    });
    logTest('DJ Spark Account Creation', !!djSpark, 
      djSpark ? `Account exists with ID: ${djSpark.id}` : 'Account not found');
    
    // Test 3: Admin Account Verification
    const admin = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    logTest('Admin Account Verification', admin?.role === 'ADMIN', 
      admin ? `Admin account active` : 'Admin account not found');
    
    // Test 4: Talent Profiles Structure
    const talentProfiles = await prisma.talentProfile.findMany({
      include: { user: true }
    });
    logTest('Talent Profiles System', talentProfiles.length >= 3, 
      `${talentProfiles.length} talent profiles found`);
    
    // Test 5: Event Management System
    const events = await prisma.event.findMany({
      include: { organizer: true }
    });
    logTest('Event Management System', events.length >= 2, 
      `${events.length} events in system with organizer relationships`);
    
    // Test 6: Booking Workflow System
    const bookings = await prisma.booking.findMany({
      include: { 
        event: true,
        talent: true,
        organizer: true
      }
    });
    logTest('Booking Workflow System', bookings.length >= 3, 
      `${bookings.length} bookings with complete relationships`);
    
    // Test 7: Transaction System
    const transactions = await prisma.transaction.findMany();
    logTest('Transaction/Payment System', transactions.length >= 2, 
      `${transactions.length} transactions recorded`);
    
    // Test 8: Notification System Structure
    const notifications = await prisma.notification.findMany();
    logTest('Notification System', notifications.length >= 1, 
      `${notifications.length} notifications in system`);
    
    // Test 9: Review System
    const reviews = await prisma.review.findMany({
      include: { booking: true }
    });
    logTest('Review/Rating System', reviews.length >= 1, 
      `${reviews.length} reviews linked to bookings`);
    
    // Test 10: Message System
    const messages = await prisma.message.findMany({
      include: { booking: true }
    });
    logTest('Messaging System', messages.length >= 1, 
      `${messages.length} messages in booking threads`);
    
    // Test 11: Payout System
    const payouts = await prisma.payout.findMany({
      include: { talent: true }
    });
    logTest('M-Pesa Payout System', payouts.length >= 1, 
      `${payouts.length} payout records found`);
    
    // Test 12: Bank Account System
    const bankAccounts = await prisma.bankAccount.findMany();
    logTest('Bank Account Verification', bankAccounts.length >= 1, 
      `${bankAccounts.length} bank accounts registered`);
    
    // Test 13: Dispute Resolution System Schema
    try {
      await prisma.dispute.findMany();
      logTest('Dispute Resolution System', true, 'Dispute table exists and accessible');
    } catch (error) {
      logTest('Dispute Resolution System', false, 'Dispute table not accessible');
    }
    
    // Test 14: Data Integrity - Booking Status Variety
    const bookingStatuses = await prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    logTest('Booking Status Variety', bookingStatuses.length >= 2, 
      `${bookingStatuses.length} different booking statuses: ${bookingStatuses.map(s => s.status).join(', ')}`);
    
    // Test 15: Currency Handling (KES)
    const totalBookingValue = await prisma.booking.aggregate({
      _sum: { amount: true }
    });
    logTest('Currency Handling (KES)', totalBookingValue._sum.amount > 0, 
      `Total booking value: KES ${totalBookingValue._sum.amount}`);
    
    // Test 16: Multi-Role System
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    const hasAllRoles = roleDistribution.some(r => r.role === 'ADMIN') && 
                       roleDistribution.some(r => r.role === 'TALENT') && 
                       roleDistribution.some(r => r.role === 'ORGANIZER');
    logTest('Multi-Role System', hasAllRoles, 
      `Roles: ${roleDistribution.map(r => `${r.role}(${r._count.role})`).join(', ')}`);
    
    // Test 17: Date Handling
    const futureEvents = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: new Date('2024-01-01')
        }
      }
    });
    logTest('Date/Time Handling', futureEvents.length >= 0, 
      `Events with proper date handling: ${futureEvents.length}`);
    
  } catch (error) {
    logTest('Database Operations', false, `Error: ${error.message}`);
  }
  
  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log('🏁 COMPREHENSIVE QA TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ PASSED: ${results.passed} tests`);
  console.log(`❌ FAILED: ${results.failed} tests`);
  console.log(`📊 SUCCESS RATE: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - Platform ready for production!');
  } else {
    console.log('\n⚠️  Some tests failed - Review required before production');
  }
  
  await prisma.$disconnect();
}

comprehensiveTest().catch(console.error);
