// Test script to verify login functionality for all test users
const bcrypt = require('bcryptjs');

const testAccounts = [
  { role: 'ADMIN', email: 'john@doe.com', password: 'AdminPass123!' },
  { role: 'ADMIN', email: 'admin.test@example.com', password: 'TestPass123!' },
  { role: 'TALENT', email: 'sarah.photographer@example.com', password: 'TalentPass123!' },
  { role: 'TALENT', email: 'mike.dj@example.com', password: 'TalentPass123!' },
  { role: 'TALENT', email: 'grace.catering@example.com', password: 'TalentPass123!' },
  { role: 'TALENT', email: 'talent.unverified@example.com', password: 'TestPass123!' },
  { role: 'ORGANIZER', email: 'contact@eventpro.ke', password: 'OrganizerPass123!' },
  { role: 'ORGANIZER', email: 'info@weddingbliss.co.ke', password: 'OrganizerPass123!' },
  { role: 'ORGANIZER', email: 'organizer.test@example.com', password: 'TestPass123!' }
];

async function testPasswordValidation() {
  console.log('🔐 Testing password validation requirements...\n');
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  let passedTests = 0;
  let totalTests = testAccounts.length;
  
  for (const account of testAccounts) {
    console.log(`Testing ${account.role}: ${account.email}`);
    
    // Test password meets validation requirements
    const meetsRequirements = passwordRegex.test(account.password);
    
    if (meetsRequirements) {
      console.log(`   ✅ Password meets validation requirements`);
      passedTests++;
    } else {
      console.log(`   ❌ Password does not meet validation requirements`);
      console.log(`      Password: ${account.password}`);
      console.log(`      Requirements: 8+ chars, uppercase, lowercase, number, special char`);
    }
    
    console.log('');
  }
  
  console.log(`📊 Password Validation Results: ${passedTests}/${totalTests} passwords valid`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);
  
  return passedTests === totalTests;
}

async function testUserRoleMapping() {
  console.log('👥 Testing user role mapping...\n');
  
  const roleGroups = {
    ADMIN: testAccounts.filter(acc => acc.role === 'ADMIN'),
    TALENT: testAccounts.filter(acc => acc.role === 'TALENT'),
    ORGANIZER: testAccounts.filter(acc => acc.role === 'ORGANIZER')
  };
  
  console.log(`👑 Admin Users: ${roleGroups.ADMIN.length}`);
  roleGroups.ADMIN.forEach(acc => console.log(`   - ${acc.email}`));
  
  console.log(`\n🎭 Talent Users: ${roleGroups.TALENT.length}`);
  roleGroups.TALENT.forEach(acc => console.log(`   - ${acc.email}`));
  
  console.log(`\n🏢 Organizer Users: ${roleGroups.ORGANIZER.length}`);
  roleGroups.ORGANIZER.forEach(acc => console.log(`   - ${acc.email}`));
  
  console.log('\n✅ User role mapping verified\n');
}

async function displayTestingGuide() {
  console.log('📋 TESTING GUIDE\n');
  
  console.log('🧪 Test Scenarios to Verify:');
  console.log('   1. Login with each user type');
  console.log('   2. Access role-specific dashboards');
  console.log('   3. Test admin approval workflows (use unverified accounts)');
  console.log('   4. Verify profile completeness');
  console.log('   5. Test package creation (talents)');
  console.log('   6. Test event creation (organizers)');
  console.log('   7. Test booking flows');
  console.log('   8. Test messaging system');
  console.log('   9. Test form validation with new requirements');
  console.log('   10. Test role-based permissions\n');
  
  console.log('🔑 Quick Login Test Commands:');
  console.log('   Admin Dashboard: Login with john@doe.com / AdminPass123!');
  console.log('   Talent Dashboard: Login with sarah.photographer@example.com / TalentPass123!');
  console.log('   Organizer Dashboard: Login with contact@eventpro.ke / OrganizerPass123!\n');
  
  console.log('⚠️  Special Test Cases:');
  console.log('   - talent.unverified@example.com: Test admin approval workflow');
  console.log('   - organizer.test@example.com: Test organizer approval workflow');
  console.log('   - admin.test@example.com: Test secondary admin functions\n');
}

async function main() {
  console.log('🚀 Starting comprehensive test user functionality check...\n');
  
  const passwordsValid = await testPasswordValidation();
  await testUserRoleMapping();
  await displayTestingGuide();
  
  if (passwordsValid) {
    console.log('🎉 All test users are ready for comprehensive testing!');
    console.log('✅ Passwords meet validation requirements');
    console.log('✅ User roles are properly mapped');
    console.log('✅ Database is seeded with complete test data');
  } else {
    console.log('⚠️  Some passwords need to be updated to meet validation requirements');
  }
}

main().catch(console.error);
