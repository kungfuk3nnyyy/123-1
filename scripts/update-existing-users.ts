
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updateExistingTestUsers() {
  console.log('🔄 Updating existing test users to meet current validation requirements...\n')
  
  // Update passwords to meet validation requirements
  const passwordUpdates = [
    { email: 'john@doe.com', newPassword: 'AdminPass123!' },
    { email: 'sarah.photographer@example.com', newPassword: 'TalentPass123!' },
    { email: 'mike.dj@example.com', newPassword: 'TalentPass123!' },
    { email: 'grace.catering@example.com', newPassword: 'TalentPass123!' },
    { email: 'contact@eventpro.ke', newPassword: 'OrganizerPass123!' }
  ]
  
  for (const update of passwordUpdates) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: update.email }
      })
      
      if (user) {
        const hashedPassword = await bcrypt.hash(update.newPassword, 12)
        
        await prisma.user.update({
          where: { email: update.email },
          data: {
            password: hashedPassword,
            isEmailVerified: true,
            emailVerified: new Date(),
            adminApprovalStatus: user.role === 'ADMIN' ? 'APPROVED' : user.adminApprovalStatus,
            verificationStatus: 'VERIFIED'
          }
        })
        
        console.log(`✅ Updated ${update.email} with new secure password`)
      } else {
        console.log(`⚠️  User ${update.email} not found`)
      }
    } catch (error) {
      console.log(`❌ Error updating ${update.email}: ${error}`)
    }
  }
  
  // Ensure all users have referral codes
  const usersWithoutReferralCodes = await prisma.user.findMany({
    where: {
      referralCode: null
    }
  })
  
  for (const user of usersWithoutReferralCodes) {
    const referralCode = `${user.role}${user.id.slice(-3).toUpperCase()}`
    
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode }
    })
    
    console.log(`✅ Added referral code ${referralCode} to ${user.email}`)
  }
  
  // Create missing notification preferences
  const usersWithoutPreferences = await prisma.user.findMany({
    where: {
      NotificationPreference: null
    }
  })
  
  for (const user of usersWithoutPreferences) {
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        emailMessages: true,
        emailBookings: true,
        emailPayments: true,
        emailReviews: true,
        emailReminders: true,
        emailPayouts: true,
        emailAdminUpdates: true
      }
    })
    
    console.log(`✅ Created notification preferences for ${user.email}`)
  }
  
  console.log('\n🎉 All existing test users have been updated successfully!')
}

updateExistingTestUsers()
  .catch((e) => {
    console.error('❌ Error during update:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
