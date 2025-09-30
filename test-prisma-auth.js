
import { prisma } from './lib/db.js';

async function testPrismaAuth() {
  try {
    console.log('Testing Prisma client initialization...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log('✅ Database connected. User count:', userCount);
    
    // Test finding a user (simulating login)
    const testUser = await prisma.user.findFirst({
      where: { email: 'admin@gigsecure.co.ke' }
    });
    
    if (testUser) {
      console.log('✅ User found:', testUser.email, 'Role:', testUser.role);
    } else {
      console.log('❌ Test user not found');
    }
    
    // Test auth-related fields
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
        adminApprovalStatus: true,
        isEmailVerified: true,
        isActive: true
      }
    });
    
    if (adminUser) {
      console.log('✅ Admin user status:');
      console.log('  - Email:', adminUser.email);
      console.log('  - Approval Status:', adminUser.adminApprovalStatus);
      console.log('  - Email Verified:', adminUser.isEmailVerified);
      console.log('  - Is Active:', adminUser.isActive);
    }
    
    console.log('✅ Prisma client working correctly!');
    
  } catch (error) {
    console.error('❌ Prisma error:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaAuth();
