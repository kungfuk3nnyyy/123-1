
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function comprehensiveAdminLoginTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 COMPREHENSIVE ADMIN LOGIN TEST');
    console.log('=====================================\n');
    
    // 1. Test Database Connection
    console.log('1️⃣  Testing Database Connection...');
    try {
      await prisma.$connect();
      console.log('   ✅ Database connection successful\n');
    } catch (error) {
      console.log('   ❌ Database connection failed:', error.message);
      return;
    }
    
    // 2. Check Admin User Exists
    console.log('2️⃣  Checking Admin User...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        adminApprovalStatus: true,
        password: true,
        createdAt: true,
        adminApprovedAt: true
      }
    });
    
    if (!adminUser) {
      console.log('   ❌ Admin user john@doe.com not found!');
      return;
    }
    
    console.log('   ✅ Admin user found');
    console.log(`      Email: ${adminUser.email}`);
    console.log(`      Name: ${adminUser.name}`);
    console.log(`      Role: ${adminUser.role}`);
    console.log(`      Active: ${adminUser.isActive}`);
    console.log(`      Email Verified: ${adminUser.isEmailVerified}`);
    console.log(`      Admin Status: ${adminUser.adminApprovalStatus}`);
    console.log(`      Has Password: ${adminUser.password ? 'Yes' : 'No'}`);
    console.log(`      Approved At: ${adminUser.adminApprovedAt || 'Not set'}\n`);
    
    // 3. Test Password Validation
    console.log('3️⃣  Testing Password Validation...');
    const testPassword = 'johndoe123';
    
    if (!adminUser.password) {
      console.log('   ❌ No password hash found for admin user');
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
    console.log(`   ${isPasswordValid ? '✅' : '❌'} Password validation for '${testPassword}': ${isPasswordValid ? 'VALID' : 'INVALID'}\n`);
    
    // 4. Simulate Authentication Logic
    console.log('4️⃣  Simulating Authentication Logic...');
    let authErrors = [];
    
    // Check email and password provided
    if (!adminUser.email || !testPassword) {
      authErrors.push('Email and password are required');
    }
    
    // Check user exists and has password
    if (!adminUser || !adminUser.password) {
      authErrors.push('Invalid credentials');
    }
    
    // Check password validity
    if (!isPasswordValid) {
      authErrors.push('Invalid credentials');
    }
    
    // Check email verification
    if (!adminUser.isEmailVerified) {
      authErrors.push('Email not verified. Please check your email and verify your account before logging in.');
    }
    
    // Check admin approval status
    if (adminUser.role === 'ADMIN' && adminUser.adminApprovalStatus !== 'APPROVED') {
      if (adminUser.adminApprovalStatus === 'PENDING') {
        authErrors.push('Your admin account is pending approval. Please wait for an existing admin to approve your account.');
      } else if (adminUser.adminApprovalStatus === 'REJECTED') {
        authErrors.push('Your admin account has been rejected. Please contact support for assistance.');
      }
    }
    
    if (authErrors.length > 0) {
      console.log('   ❌ Authentication would FAIL with errors:');
      authErrors.forEach(error => console.log(`      - ${error}`));
      console.log('');
      return;
    } else {
      console.log('   ✅ Authentication logic validation PASSED\n');
    }
    
    // 5. Check Session Token Creation
    console.log('5️⃣  Checking Session Token Data...');
    const sessionUser = {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      image: adminUser.image,
      adminApprovalStatus: adminUser.adminApprovalStatus
    };
    
    console.log('   ✅ Session token data ready:');
    console.log(`      ID: ${sessionUser.id}`);
    console.log(`      Email: ${sessionUser.email}`);
    console.log(`      Role: ${sessionUser.role}`);
    console.log(`      Admin Status: ${sessionUser.adminApprovalStatus}\n`);
    
    // 6. Final Validation
    console.log('6️⃣  FINAL VALIDATION RESULTS');
    console.log('=====================================');
    
    const checks = [
      { name: 'Database Connection', status: true },
      { name: 'Admin User Exists', status: !!adminUser },
      { name: 'Role is ADMIN', status: adminUser.role === 'ADMIN' },
      { name: 'Account Active', status: adminUser.isActive === true },
      { name: 'Email Verified', status: adminUser.isEmailVerified === true },
      { name: 'Admin Status APPROVED', status: adminUser.adminApprovalStatus === 'APPROVED' },
      { name: 'Password Valid', status: isPasswordValid },
      { name: 'Authentication Logic', status: authErrors.length === 0 }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`   ${icon} ${check.name}`);
      if (!check.status) allPassed = false;
    });
    
    console.log('\n=====================================');
    
    if (allPassed) {
      console.log('🎉 SUCCESS: Admin login should work perfectly!');
      console.log('\n📝 Login Credentials:');
      console.log('   Email: john@doe.com');
      console.log('   Password: johndoe123');
      console.log('\n🌐 Next Steps:');
      console.log('   1. Navigate to http://localhost:3000/auth/login');
      console.log('   2. Enter the credentials above');
      console.log('   3. Should redirect to admin dashboard at /admin');
      console.log('\n🔧 If login still fails, check:');
      console.log('   - NextJS server is running (yarn dev)');
      console.log('   - Browser console for JavaScript errors');
      console.log('   - Network tab for authentication API calls');
    } else {
      console.log('❌ FAILURE: Admin login will not work - issues found above');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
comprehensiveAdminLoginTest();
