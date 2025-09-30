const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseAccounts() {
  console.log('🔍 Checking test accounts in database...\n');

  const testEmails = [
    'john@doe.com',
    'sarah.photographer@example.com', 
    'contact@eventpro.ke'
  ];

  for (const email of testEmails) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          password: true
        }
      });

      if (user) {
        console.log(`✅ Found ${user.role}: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}\n`);
      } else {
        console.log(`❌ User not found: ${email}\n`);
      }
    } catch (error) {
      console.log(`⚠️ Error checking ${email}:`, error.message, '\n');
    }
  }
}

async function testPasswordVerification() {
  console.log('🔐 Testing password verification...\n');

  const testCredentials = [
    { email: 'john@doe.com', password: 'johndoe123' },
    { email: 'sarah.photographer@example.com', password: 'password123' },
    { email: 'contact@eventpro.ke', password: 'password123' }
  ];

  for (const cred of testCredentials) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: cred.email }
      });

      if (user && user.password) {
        const isValid = await bcrypt.compare(cred.password, user.password);
        console.log(`${isValid ? '✅' : '❌'} Password verification for ${cred.email}: ${isValid ? 'Valid' : 'Invalid'}`);
      } else {
        console.log(`❌ User or password not found for ${cred.email}`);
      }
    } catch (error) {
      console.log(`⚠️ Error testing ${cred.email}:`, error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive authentication tests...\n');
  
  try {
    await testDatabaseAccounts();
    await testPasswordVerification();
    
    console.log('\n✅ All database tests completed!');
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Open browser to http://localhost:3000/auth/login');
    console.log('2. Test with these credentials:');
    console.log('   Admin: john@doe.com / johndoe123');
    console.log('   Talent: sarah.photographer@example.com / password123');
    console.log('   Organizer: contact@eventpro.ke / password123');
    console.log('3. Check browser console for redirect debug logs');
    console.log('4. Verify redirect to appropriate dashboard');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
