
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

interface TestUser {
  email: string
  password: string
  role: string
  expectedStatus: string
}

const testUsers: TestUser[] = [
  { email: 'john@doe.com', password: 'AdminPass123!', role: 'ADMIN', expectedStatus: 'APPROVED' },
  { email: 'admin.test@example.com', password: 'TestPass123!', role: 'ADMIN', expectedStatus: 'APPROVED' },
  { email: 'sarah.photographer@example.com', password: 'TalentPass123!', role: 'TALENT', expectedStatus: 'APPROVED' },
  { email: 'mike.dj@example.com', password: 'TalentPass123!', role: 'TALENT', expectedStatus: 'APPROVED' },
  { email: 'grace.catering@example.com', password: 'TalentPass123!', role: 'TALENT', expectedStatus: 'APPROVED' },
  { email: 'talent.unverified@example.com', password: 'TestPass123!', role: 'TALENT', expectedStatus: 'PENDING' },
  { email: 'contact@eventpro.ke', password: 'OrganizerPass123!', role: 'ORGANIZER', expectedStatus: 'APPROVED' },
  { email: 'info@weddingbliss.co.ke', password: 'OrganizerPass123!', role: 'ORGANIZER', expectedStatus: 'APPROVED' },
  { email: 'organizer.test@example.com', password: 'TestPass123!', role: 'ORGANIZER', expectedStatus: 'PENDING' }
]

async function validateTestUsers() {
  console.log('🔍 Validating test user functionality...\n')
  
  let passedTests = 0
  let totalTests = 0
  
  for (const testUser of testUsers) {
    totalTests++
    console.log(`Testing ${testUser.role}: ${testUser.email}`)
    
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        include: {
          TalentProfile: true,
          OrganizerProfile: true
        }
      })
      
      if (!user) {
        console.log(`   ❌ User not found`)
        continue
      }
      
      // Check role
      if (user.role !== testUser.role) {
        console.log(`   ❌ Role mismatch: expected ${testUser.role}, got ${user.role}`)
        continue
      }
      
      // Check admin approval status
      if (user.adminApprovalStatus !== testUser.expectedStatus) {
        console.log(`   ❌ Status mismatch: expected ${testUser.expectedStatus}, got ${user.adminApprovalStatus}`)
        continue
      }
      
      // Check password hash
      if (!user.password) {
        console.log(`   ❌ No password hash found`)
        continue
      }
      
      const isPasswordValid = await bcrypt.compare(testUser.password, user.password)
      if (!isPasswordValid) {
        console.log(`   ❌ Password validation failed`)
        continue
      }
      
      // Check email verification
      if (!user.isEmailVerified) {
        console.log(`   ❌ Email not verified`)
        continue
      }
      
      // Check profile completeness for non-admin users
      if (testUser.role === 'TALENT' && !user.TalentProfile) {
        console.log(`   ❌ Missing talent profile`)
        continue
      }
      
      if (testUser.role === 'ORGANIZER' && !user.OrganizerProfile) {
        console.log(`   ❌ Missing organizer profile`)
        continue
      }
      
      console.log(`   ✅ All validations passed`)
      passedTests++
      
    } catch (error) {
      console.log(`   ❌ Error during validation: ${error}`)
    }
    
    console.log('')
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} users validated successfully`)
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All test users are functioning correctly!')
  } else {
    console.log('⚠️  Some test users need attention. Run the seed script to fix issues.')
  }
}

async function checkPackages() {
  console.log('\n📦 Checking test packages...')
  
  const packages = await prisma.package.findMany({
    include: {
      TalentProfile: {
        include: {
          User: true
        }
      }
    }
  })
  
  console.log(`Found ${packages.length} packages`)
  
  for (const pkg of packages) {
    console.log(`   📦 ${pkg.title} - ${pkg.TalentProfile.User.name} (${pkg.category})`)
  }
}

async function main() {
  await validateTestUsers()
  await checkPackages()
}

main()
  .catch((e) => {
    console.error('❌ Error during validation:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
