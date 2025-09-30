
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function emergencyAdminFix() {
  try {
    console.log('🚨 Starting Emergency Admin Lockout Resolution...')
    
    // Step 1: Check current state of john@doe.com account
    console.log('\n1. Checking current admin account status...')
    const adminUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminApprovalStatus: true,
        adminApprovedAt: true,
        adminApprovedBy: true,
        isActive: true,
        emailVerified: true,
        isEmailVerified: true
      }
    })

    if (!adminUser) {
      console.log('❌ ERROR: Admin user john@doe.com not found in database!')
      return
    }

    console.log('👤 Current Admin Account Status:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Name: ${adminUser.name}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   Admin Approval Status: ${adminUser.adminApprovalStatus}`)
    console.log(`   Is Active: ${adminUser.isActive}`)
    console.log(`   Email Verified: ${adminUser.isEmailVerified}`)
    console.log(`   Admin Approved At: ${adminUser.adminApprovedAt}`)

    // Step 2: Update approval status if needed
    if (adminUser.adminApprovalStatus !== 'APPROVED') {
      console.log('\n2. ⚡ Applying emergency approval...')
      
      const updatedUser = await prisma.user.update({
        where: { email: 'john@doe.com' },
        data: {
          adminApprovalStatus: 'APPROVED',
          adminApprovedAt: new Date(),
          adminApprovedBy: 'EMERGENCY_SYSTEM_FIX',
          // Ensure other required fields are set
          isActive: true,
          isEmailVerified: true,
          emailVerified: adminUser.emailVerified || new Date()
        },
        select: {
          id: true,
          email: true,
          role: true,
          adminApprovalStatus: true,
          adminApprovedAt: true,
          adminApprovedBy: true,
          isActive: true,
          isEmailVerified: true
        }
      })

      console.log('✅ SUCCESS: Admin approval status updated!')
      console.log(`   New Status: ${updatedUser.adminApprovalStatus}`)
      console.log(`   Approved At: ${updatedUser.adminApprovedAt}`)
      console.log(`   Approved By: ${updatedUser.adminApprovedBy}`)
    } else {
      console.log('\n2. ✅ Admin account already approved - no update needed')
    }

    // Step 3: Final verification
    console.log('\n3. 🔍 Final verification of admin account...')
    const verifiedUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' },
      select: {
        email: true,
        role: true,
        adminApprovalStatus: true,
        isActive: true,
        isEmailVerified: true,
        adminApprovedAt: true
      }
    })

    console.log('📋 Final Account Status:')
    console.log(`   ✓ Role: ${verifiedUser.role}`)
    console.log(`   ✓ Admin Status: ${verifiedUser.adminApprovalStatus}`)
    console.log(`   ✓ Is Active: ${verifiedUser.isActive}`)
    console.log(`   ✓ Email Verified: ${verifiedUser.isEmailVerified}`)
    
    // Check if all conditions are met for successful login
    const canLogin = verifiedUser.role === 'ADMIN' && 
                    verifiedUser.adminApprovalStatus === 'APPROVED' && 
                    verifiedUser.isActive && 
                    verifiedUser.isEmailVerified

    console.log(`\n🎯 Login Status: ${canLogin ? '✅ READY FOR LOGIN' : '❌ STILL BLOCKED'}`)
    
    if (canLogin) {
      console.log('\n🎉 Emergency lockout resolution COMPLETED!')
      console.log('   Admin can now login with credentials:')
      console.log('   Email: john@doe.com')
      console.log('   Password: johndoe123')
    }

  } catch (error) {
    console.error('💥 ERROR during emergency fix:', error)
    console.error('Stack trace:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the emergency fix
emergencyAdminFix()
  .then(() => {
    console.log('\n🔚 Emergency fix script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 FATAL ERROR:', error)
    process.exit(1)
  })
