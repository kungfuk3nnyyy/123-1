import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TestUser {
  email: string;
  password: string;
  expectedRole: UserRole;
}

const testUsers: TestUser[] = [
  {
    email: 'admin@example.com',
    password: 'superadminpassword',
    expectedRole: UserRole.ADMIN
  },
  {
    email: 'talent1@example.com',
    password: 'password123',
    expectedRole: UserRole.TALENT
  },
  {
    email: 'organizer1@example.com',
    password: 'password123',
    expectedRole: UserRole.ORGANIZER
  }
];

async function verifyUsers() {
  console.log('🔍 Starting User Verification Process...\n');
  
  let allTestsPassed = true;
  
  for (const testUser of testUsers) {
    console.log(`\n📧 Testing user: ${testUser.email}`);
    console.log('=' .repeat(50));
    
    try {
      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        include: {
          TalentProfile: true,
          OrganizerProfile: true
        }
      });
      
      if (!user) {
        console.log(`❌ User not found in database`);
        allTestsPassed = false;
        continue;
      }
      
      // Check basic user properties
      console.log(`✅ User found in database`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Active: ${user.isActive}`);
      console.log(`   - Email Verified: ${user.isEmailVerified}`);
      console.log(`   - Admin Approval Status: ${user.adminApprovalStatus}`);
      console.log(`   - Verification Status: ${user.verificationStatus}`);
      
      // Verify role matches expected
      if (user.role !== testUser.expectedRole) {
        console.log(`❌ Role mismatch! Expected: ${testUser.expectedRole}, Got: ${user.role}`);
        allTestsPassed = false;
      } else {
        console.log(`✅ Role matches expected: ${user.role}`);
      }
      
      // Test password authentication
      if (!user.password) {
        console.log(`❌ No password hash found in database`);
        allTestsPassed = false;
      } else {
        const passwordValid = await bcrypt.compare(testUser.password, user.password);
        if (passwordValid) {
          console.log(`✅ Password authentication successful`);
        } else {
          console.log(`❌ Password authentication failed`);
          allTestsPassed = false;
        }
      }
      
      // Check profile data based on role
      if (user.role === UserRole.TALENT) {
        if (user.TalentProfile) {
          console.log(`✅ TalentProfile exists`);
          console.log(`   - Bio: ${user.TalentProfile.bio?.substring(0, 50)}...`);
          console.log(`   - Category: ${user.TalentProfile.category}`);
          console.log(`   - Location: ${user.TalentProfile.location}`);
        } else {
          console.log(`❌ TalentProfile missing for talent user`);
          allTestsPassed = false;
        }
      }
      
      if (user.role === UserRole.ORGANIZER) {
        console.log(`✅ Organizer user verified`);
        // Note: OrganizerProfile is optional in the current schema
      }
      
      if (user.role === UserRole.ADMIN) {
        console.log(`✅ Admin user verified`);
        console.log(`   - Admin approval status: ${user.adminApprovalStatus}`);
      }
      
      // Check account status
      if (!user.isActive) {
        console.log(`⚠️  User account is not active`);
      }
      
      if (!user.isEmailVerified) {
        console.log(`⚠️  User email is not verified`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing user: ${error}`);
      allTestsPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! All test users are working correctly.');
    console.log('\n✅ Database migration: SUCCESS');
    console.log('✅ User creation: SUCCESS');
    console.log('✅ Password hashing: SUCCESS');
    console.log('✅ Role assignment: SUCCESS');
    console.log('✅ Authentication: SUCCESS');
  } else {
    console.log('❌ SOME TESTS FAILED! Please check the issues above.');
  }
  
  // Additional database statistics
  console.log('\n📈 DATABASE STATISTICS:');
  const userCount = await prisma.user.count();
  const talentCount = await prisma.user.count({ where: { role: UserRole.TALENT } });
  const organizerCount = await prisma.user.count({ where: { role: UserRole.ORGANIZER } });
  const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
  const eventCount = await prisma.event.count();
  const packageCount = await prisma.package.count();
  
  console.log(`   - Total Users: ${userCount}`);
  console.log(`   - Talents: ${talentCount}`);
  console.log(`   - Organizers: ${organizerCount}`);
  console.log(`   - Admins: ${adminCount}`);
  console.log(`   - Events: ${eventCount}`);
  console.log(`   - Packages: ${packageCount}`);
  
  return allTestsPassed;
}

async function main() {
  try {
    const success = await verifyUsers();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
