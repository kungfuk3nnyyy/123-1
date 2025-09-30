

import { PrismaClient, ReviewerType, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateReviewTypes() {
  console.log('Starting review type migration...')
  
  try {
    // Get all reviews with their giver's role
    const reviews = await prisma.review.findMany({
      select: {
        id: true,
        reviewerType: true,
        User_Review_giverIdToUser: {
          select: {
            id: true,
            role: true
          }
        }
      }
    })

    console.log(`Found ${reviews.length} reviews to migrate`)

    // Update each review with correct reviewerType based on giver's role
    for (const review of reviews) {
      const correctReviewerType = review.User_Review_giverIdToUser.role === UserRole.TALENT ? ReviewerType.TALENT : ReviewerType.ORGANIZER
      
      if (review.reviewerType !== correctReviewerType) {
        await prisma.review.update({
          where: { id: review.id },
          data: { reviewerType: correctReviewerType }
        })
        console.log(`Updated review ${review.id} to ${correctReviewerType}`)
      }
    }

    console.log('Review type migration completed successfully!')
  } catch (error) {
    console.error('Error during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateReviewTypes()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
