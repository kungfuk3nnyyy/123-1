
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export interface MergeAccountsOptions {
  primaryUserId: string
  mergedUserId: string
  mergeReason: string
  mergedByAdminId?: string
  mergedByUserId?: string
  mergeType: 'ADMIN_INITIATED' | 'USER_INITIATED' | 'AUTOMATIC'
}

export interface MergePreview {
  primaryUser: {
    id: string
    email: string
    name: string | null
    role: UserRole
    createdAt: Date
  }
  mergedUser: {
    id: string
    email: string
    name: string | null
    role: UserRole
    createdAt: Date
  }
  dataToMerge: {
    bookings: number
    messages: number
    reviews: number
    transactions: number
    events: number
    packages: number
    notifications: number
  }
  conflicts: string[]
}

/**
 * Preview what will happen when merging two accounts
 */
export async function previewAccountMerge(primaryUserId: string, mergedUserId: string): Promise<MergePreview> {
  // Get both users with their related data counts
  const [primaryUser, mergedUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: primaryUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            Booking_Booking_organizerIdToUser: true,
            Booking_Booking_talentIdToUser: true,
            Message_Message_senderIdToUser: true,
            Message_Message_receiverIdToUser: true,
            Review_Review_giverIdToUser: true,
            Review_Review_receiverIdToUser: true,
            Transaction: true,
            Event: true,
            Notification: true
          }
        },
        TalentProfile: {
          select: {
            _count: {
              select: {
                Package: true
              }
            }
          }
        }
      }
    }),
    prisma.user.findUnique({
      where: { id: mergedUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            Booking_Booking_organizerIdToUser: true,
            Booking_Booking_talentIdToUser: true,
            Message_Message_senderIdToUser: true,
            Message_Message_receiverIdToUser: true,
            Review_Review_giverIdToUser: true,
            Review_Review_receiverIdToUser: true,
            Transaction: true,
            Event: true,
            Notification: true
          }
        },
        TalentProfile: {
          select: {
            _count: {
              select: {
                Package: true
              }
            }
          }
        }
      }
    })
  ])

  if (!primaryUser || !mergedUser) {
    throw new Error('One or both users not found')
  }

  // Calculate data to merge
  const dataToMerge = {
    bookings: mergedUser._count.Booking_Booking_organizerIdToUser + mergedUser._count.Booking_Booking_talentIdToUser,
    messages: mergedUser._count.Message_Message_senderIdToUser + mergedUser._count.Message_Message_receiverIdToUser,
    reviews: mergedUser._count.Review_Review_giverIdToUser + mergedUser._count.Review_Review_receiverIdToUser,
    transactions: mergedUser._count.Transaction,
    events: mergedUser._count.Event,
    packages: mergedUser.TalentProfile?._count.Package || 0,
    notifications: mergedUser._count.Notification
  }

  // Identify potential conflicts
  const conflicts: string[] = []

  if (primaryUser.role !== mergedUser.role) {
    conflicts.push(`Role conflict: Primary user is ${primaryUser.role}, merged user is ${mergedUser.role}`)
  }

  if (primaryUser.email !== mergedUser.email) {
    conflicts.push(`Email conflict: Primary user has ${primaryUser.email}, merged user has ${mergedUser.email}`)
  }

  if (primaryUser.name !== mergedUser.name && mergedUser.name) {
    conflicts.push(`Name conflict: Primary user is "${primaryUser.name}", merged user is "${mergedUser.name}"`)
  }

  return {
    primaryUser: {
      id: primaryUser.id,
      email: primaryUser.email,
      name: primaryUser.name,
      role: primaryUser.role,
      createdAt: primaryUser.createdAt
    },
    mergedUser: {
      id: mergedUser.id,
      email: mergedUser.email,
      name: mergedUser.name,
      role: mergedUser.role,
      createdAt: mergedUser.createdAt
    },
    dataToMerge,
    conflicts
  }
}

/**
 * Merge two user accounts
 */
export async function mergeAccounts(options: MergeAccountsOptions): Promise<void> {
  const { primaryUserId, mergedUserId, mergeReason, mergedByAdminId, mergedByUserId, mergeType } = options

  // Get preview to validate the merge
  const preview = await previewAccountMerge(primaryUserId, mergedUserId)

  // Perform the merge in a transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update all bookings where merged user is organizer
    await tx.booking.updateMany({
      where: { organizerId: mergedUserId },
      data: { organizerId: primaryUserId }
    })

    // 2. Update all bookings where merged user is talent
    await tx.booking.updateMany({
      where: { talentId: mergedUserId },
      data: { talentId: primaryUserId }
    })

    // 3. Update all messages where merged user is sender
    await tx.message.updateMany({
      where: { senderId: mergedUserId },
      data: { senderId: primaryUserId }
    })

    // 4. Update all messages where merged user is receiver
    await tx.message.updateMany({
      where: { receiverId: mergedUserId },
      data: { receiverId: primaryUserId }
    })

    // 5. Update all reviews where merged user is giver
    await tx.review.updateMany({
      where: { giverId: mergedUserId },
      data: { giverId: primaryUserId }
    })

    // 6. Update all reviews where merged user is receiver
    await tx.review.updateMany({
      where: { receiverId: mergedUserId },
      data: { receiverId: primaryUserId }
    })

    // 7. Update all transactions
    await tx.transaction.updateMany({
      where: { userId: mergedUserId },
      data: { userId: primaryUserId }
    })

    // 8. Update all events
    await tx.event.updateMany({
      where: { organizerId: mergedUserId },
      data: { organizerId: primaryUserId }
    })

    // 9. Update all proposals
    await tx.proposal.updateMany({
      where: { talentId: mergedUserId },
      data: { talentId: primaryUserId }
    })

    // 10. Update all notifications
    await tx.notification.updateMany({
      where: { userId: mergedUserId },
      data: { userId: primaryUserId }
    })

    // 11. Update all payouts
    await tx.payout.updateMany({
      where: { talentId: mergedUserId },
      data: { talentId: primaryUserId }
    })

    // 12. Update all disputes
    await tx.dispute.updateMany({
      where: { disputedById: mergedUserId },
      data: { disputedById: primaryUserId }
    })

    // 13. Update all referrals where merged user is referrer
    await tx.referral.updateMany({
      where: { referrerId: mergedUserId },
      data: { referrerId: primaryUserId }
    })

    // 14. Update all referrals where merged user is referred
    await tx.referral.updateMany({
      where: { referredId: mergedUserId },
      data: { referredId: primaryUserId }
    })

    // 15. Update all activities
    await tx.activity.updateMany({
      where: { userId: mergedUserId },
      data: { userId: primaryUserId }
    })

    // 16. Update all KYC submissions
    await tx.kycSubmission.updateMany({
      where: { userId: mergedUserId },
      data: { userId: primaryUserId }
    })

    // 17. Update all direct messages where merged user is sender
    await tx.directMessage.updateMany({
      where: { senderId: mergedUserId },
      data: { senderId: primaryUserId }
    })

    // 18. Update all direct messages where merged user is receiver
    await tx.directMessage.updateMany({
      where: { receiverId: mergedUserId },
      data: { receiverId: primaryUserId }
    })

    // 19. Update all talent availability records
    await tx.talentAvailability.updateMany({
      where: { talentId: mergedUserId },
      data: { talentId: primaryUserId }
    })

    // 20. Merge profile data if needed
    const mergedUserData = await tx.user.findUnique({
      where: { id: mergedUserId },
      include: {
        TalentProfile: true,
        OrganizerProfile: true
      }
    })

    if (mergedUserData?.TalentProfile) {
      // Check if primary user has talent profile
      const primaryTalentProfile = await tx.talentProfile.findUnique({
        where: { userId: primaryUserId }
      })

      if (!primaryTalentProfile) {
        // Move talent profile to primary user
        await tx.talentProfile.update({
          where: { userId: mergedUserId },
          data: { userId: primaryUserId }
        })
      } else {
        // Merge talent profile data (keep the more complete one)
        const mergedProfile = mergedUserData.TalentProfile
        const updateData: any = {}

        if (!primaryTalentProfile.bio && mergedProfile.bio) updateData.bio = mergedProfile.bio
        if (!primaryTalentProfile.tagline && mergedProfile.tagline) updateData.tagline = mergedProfile.tagline
        if (!primaryTalentProfile.location && mergedProfile.location) updateData.location = mergedProfile.location
        if (!primaryTalentProfile.website && mergedProfile.website) updateData.website = mergedProfile.website
        if (!primaryTalentProfile.phoneNumber && mergedProfile.phoneNumber) updateData.phoneNumber = mergedProfile.phoneNumber
        if (!primaryTalentProfile.category && mergedProfile.category) updateData.category = mergedProfile.category
        if (mergedProfile.skills.length > primaryTalentProfile.skills.length) updateData.skills = mergedProfile.skills
        if (!primaryTalentProfile.experience && mergedProfile.experience) updateData.experience = mergedProfile.experience
        if (!primaryTalentProfile.hourlyRate && mergedProfile.hourlyRate) updateData.hourlyRate = mergedProfile.hourlyRate
        if (!primaryTalentProfile.mpesaPhoneNumber && mergedProfile.mpesaPhoneNumber) updateData.mpesaPhoneNumber = mergedProfile.mpesaPhoneNumber

        if (Object.keys(updateData).length > 0) {
          await tx.talentProfile.update({
            where: { userId: primaryUserId },
            data: updateData
          })
        }

        // Delete the merged user's talent profile
        await tx.talentProfile.delete({
          where: { userId: mergedUserId }
        })
      }
    }

    if (mergedUserData?.OrganizerProfile) {
      // Similar logic for organizer profile
      const primaryOrganizerProfile = await tx.organizerProfile.findUnique({
        where: { userId: primaryUserId }
      })

      if (!primaryOrganizerProfile) {
        await tx.organizerProfile.update({
          where: { userId: mergedUserId },
          data: { userId: primaryUserId }
        })
      } else {
        const mergedProfile = mergedUserData.OrganizerProfile
        const updateData: any = {}

        if (!primaryOrganizerProfile.companyName && mergedProfile.companyName) updateData.companyName = mergedProfile.companyName
        if (!primaryOrganizerProfile.bio && mergedProfile.bio) updateData.bio = mergedProfile.bio
        if (!primaryOrganizerProfile.website && mergedProfile.website) updateData.website = mergedProfile.website
        if (!primaryOrganizerProfile.phoneNumber && mergedProfile.phoneNumber) updateData.phoneNumber = mergedProfile.phoneNumber
        if (!primaryOrganizerProfile.location && mergedProfile.location) updateData.location = mergedProfile.location
        if (mergedProfile.eventTypes.length > primaryOrganizerProfile.eventTypes.length) updateData.eventTypes = mergedProfile.eventTypes

        if (Object.keys(updateData).length > 0) {
          await tx.organizerProfile.update({
            where: { userId: primaryUserId },
            data: updateData
          })
        }

        await tx.organizerProfile.delete({
          where: { userId: mergedUserId }
        })
      }
    }

    // 21. Log the merge if the model exists
    const prismaClient = tx as any;
    if ('accountMerge' in prismaClient) {
      await prismaClient.accountMerge.create({
        data: {
          primaryUserId,
          mergedUserId,
          mergeReason,
          mergedData: preview.dataToMerge,
          mergedByAdminId,
          mergedByUserId,
          mergeType
        }
      });
    } else {
      console.warn('accountMerge model not found in Prisma schema - skipping merge log');
    }

    // 22. Mark duplicate detection logs as resolved if the model exists
    if ('duplicateDetectionLog' in prismaClient) {
      await prismaClient.duplicateDetectionLog.updateMany({
        where: {
          OR: [
            { potentialDuplicateUserId: mergedUserId },
            { originalUserId: mergedUserId }
          ],
          resolved: false
        },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: mergedByAdminId || mergedByUserId,
          resolutionAction: 'MERGED'
        }
      });
    }

    // 23. Finally, delete the merged user
    await tx.user.delete({
      where: { id: mergedUserId }
    })
  })
}
/**
 * Get merge history for a user
 */
export async function getMergeHistory(userId: string) {
  // Check if the model exists in the Prisma client
  const prismaClient = prisma as any;
  if (!('accountMerge' in prismaClient)) {
    console.warn('accountMerge model not found in Prisma schema');
    return [];
  }

  try {
    return await prismaClient.accountMerge.findMany({
      where: {
        resolved: false,
        similarityScore: {
          gte: 0.8
        }
      },
      include: {
        potentialDuplicateUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        },
        originalUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        similarityScore: 'desc'
      },
      take: 50
    });
  } catch (error) {
    console.error('Error fetching pending merges:', error);
    return [];
  }
}

/**
 * Get all pending duplicate detections that could be merged
 */
export async function getPendingMerges() {
  // Check if the model exists in the Prisma client
  const prismaClient = prisma as any;
  
  if (!('duplicateDetectionLog' in prismaClient)) {
    console.warn('duplicateDetectionLog model not found in Prisma schema');
    return [];
  }

  try {
    return await prismaClient.duplicateDetectionLog.findMany({
      where: {
        resolved: false,
        similarityScore: {
          gte: 0.8
        }
      },
      include: {
        potentialDuplicateUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        },
        originalUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        similarityScore: 'desc'
      },
      take: 50
    });
  } catch (error) {
    console.error('Error fetching pending merges:', error);
    return [];
  }
}
