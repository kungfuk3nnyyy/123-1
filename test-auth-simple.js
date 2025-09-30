require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAccounts() {
  console.log('🔍 Checking test accounts...\n');

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
          email: true,
          role: true,
          name: true
        }
      });

      if (user) {
        console.log(`✅ ${user.role}: ${user.email} (${user.name})`);
      } else {
        console.log(`❌ Not found: ${email}`);
      }
    } catch (error) {
      console.log(`⚠️ Error: ${email} - ${error.message}`);
    }
  }
  
  await prisma.$disconnect();
}

testAccounts();
