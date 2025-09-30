
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function verifyAdminFix() {
  try {
    console.log('🔍 VERIFICATION: Emergency Admin Fix Status')
    console.log('=====================================')
    
    // Step 1: Check admin user in database
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
        isEmailVerified: true,
        password: true
      }
    })

    if (!adminUser) {
      console.log('❌ CRITICAL: Admin user not found!')
      return
    }

    console.log('\n📊 ADMIN ACCOUNT STATUS:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Name: ${adminUser.name}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   Admin Status: ${adminUser.adminApprovalStatus}`)
    console.log(`   Is Active: ${adminUser.isActive}`)
    console.log(`   Email Verified: ${adminUser.isEmailVerified}`)
    console.log(`   Approved At: ${adminUser.adminApprovedAt}`)
    console.log(`   Approved By: ${adminUser.adminApprovedBy}`)

    // Step 2: Test password validation
    console.log('\n🔐 PASSWORD VERIFICATION:')
    const passwordValid = await bcrypt.compare('johndoe123', adminUser.password)
    console.log(`   Password Test: ${passwordValid ? '✅ VALID' : '❌ INVALID'}`)

    // Step 3: Check all login requirements
    console.log('\n✅ LOGIN REQUIREMENTS CHECK:')
    const requirements = [
      { name: 'User exists', status: !!adminUser },
      { name: 'Role is ADMIN', status: adminUser.role === 'ADMIN' },
      { name: 'Admin is APPROVED', status: adminUser.adminApprovalStatus === 'APPROVED' },
      { name: 'Account is active', status: adminUser.isActive },
      { name: 'Email verified', status: adminUser.isEmailVerified },
      { name: 'Password valid', status: passwordValid }
    ]

    requirements.forEach(req => {
      console.log(`   ${req.status ? '✅' : '❌'} ${req.name}`)
    })

    const allRequirementsMet = requirements.every(req => req.status)
    
    console.log(`\n🎯 OVERALL STATUS: ${allRequirementsMet ? '✅ LOGIN SHOULD WORK' : '❌ LOGIN BLOCKED'}`)

    if (allRequirementsMet) {
      console.log('\n🎉 SUCCESS: Emergency admin fix is COMPLETE!')
      console.log('   The admin can now login with:')
      console.log('   Email: john@doe.com')
      console.log('   Password: johndoe123')
    } else {
      console.log('\n⚠️  WARNING: Some requirements not met - login may fail')
    }

    // Step 4: Check for other potential admin users
    console.log('\n👥 OTHER ADMIN ACCOUNTS:')
    const otherAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        email: { not: 'john@doe.com' }
      },
      select: {
        email: true,
        adminApprovalStatus: true,
        isActive: true
      }
    })

    if (otherAdmins.length > 0) {
      otherAdmins.forEach(admin => {
        console.log(`   ${admin.email}: ${admin.adminApprovalStatus} (Active: ${admin.isActive})`)
      })
    } else {
      console.log('   No other admin accounts found')
    }

  } catch (error) {
    console.error('💥 ERROR during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdminFix()
