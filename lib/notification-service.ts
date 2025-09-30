
import { prisma } from '@/lib/db'
import { NotificationType, UserRole, BookingStatus } from '@prisma/client'
import { Notification, NotificationPreference } from '@prisma/client'

// Email service configuration (using a free service like SendGrid or similar)
const EMAIL_CONFIG = {
  FROM_EMAIL: 'notifications@eventtalents.co.ke',
  FROM_NAME: 'Event Talents Platform',
  // In production, you'd use environment variables for API keys
  API_KEY: process.env.EMAIL_API_KEY || 'demo-key'
}

// Notification type to email preference mapping
const EMAIL_PREFERENCE_MAP: Record<NotificationType, keyof NotificationPreference> = {
  MESSAGE_RECEIVED: 'emailMessages',
  BOOKING_REQUEST: 'emailBookings',
  BOOKING_ACCEPTED: 'emailBookings',
  BOOKING_DECLINED: 'emailBookings',
  BOOKING_PAYMENT_CONFIRMED: 'emailPayments',
  PAYOUT_PROCESSED: 'emailPayouts',
  REVIEW_RECEIVED: 'emailReviews',
  EVENT_REMINDER: 'emailReminders',
  BOOKING_COMPLETED: 'emailBookings',
  ADMIN_USER_REGISTRATION: 'emailAdminUpdates',
  DISPUTE_CREATED: 'emailBookings',
  DISPUTE_RESOLVED: 'emailBookings',
  DIRECT_MESSAGE: 'emailMessages'
}

// Create notification helper
export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  bookingId?: string
  messageId?: string
  eventId?: string
}): Promise<Notification | null> {
  try {
    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        bookingId: params.bookingId,
        messageId: params.messageId,
        eventId: params.eventId
      },
      include: {
        User: true,
        Booking: {
          include: {
            Event: true,
            User_Booking_organizerIdToUser: true,
            User_Booking_talentIdToUser: true
          }
        },
        Message: {
          include: {
            User_Message_senderIdToUser: true,
            User_Message_receiverIdToUser: true
          }
        },
        Event: {
          include: {
            User: true
          }
        }
      }
    })

    // Send email notification if user preferences allow it
    await sendEmailNotification(notification)

    return notification as any as Notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

// Send email notification
export async function sendEmailNotification(notification: any): Promise<boolean> {
  try {
    // Get user's notification preferences
    const preferences = await getUserNotificationPreferences(notification.userId)
    
    // Check if user wants email for this notification type
    const preferenceKey = EMAIL_PREFERENCE_MAP[notification.type as NotificationType]
    if (!preferences || !preferences[preferenceKey]) {
      console.log(`User ${notification.userId} has disabled email for ${notification.type}`)
      return false
    }

    // Generate email content
    const emailContent = generateEmailContent(notification)
    
    // In a real implementation, you'd use a service like SendGrid, Mailgun, etc.
    // For now, we'll simulate sending and mark as sent
    console.log('Sending email notification:', {
      to: notification.User?.email,
      subject: emailContent.subject,
      html: emailContent.html
    })

    // Update notification as email sent
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        emailSent: true,
        emailSentAt: new Date()
      }
    })

    return true
  } catch (error) {
    console.error('Error sending email notification:', error)
    return false
  }
}

// Get user notification preferences
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreference | null> {
  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
      include: { User: true }
    })

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
        include: { User: true }
      })
    }

    return preferences as any as NotificationPreference
  } catch (error) {
    console.error('Error getting notification preferences:', error)
    return null
  }
}

// Update user notification preferences
export async function updateNotificationPreferences(
  userId: string, 
  updates: Partial<NotificationPreference>
): Promise<NotificationPreference | null> {
  try {
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updates as any,
      create: {
        userId,
        ...updates
      } as any,
      include: { User: true }
    })

    return preferences as any as NotificationPreference
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return null
  }
}

// Get user notifications with pagination
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  } = {}
): Promise<{ notifications: Notification[], total: number }> {
  try {
    const { limit = 10, offset = 0, unreadOnly = false } = options

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          User: true,
          Booking: {
            include: {
              Event: true,
              User_Booking_organizerIdToUser: true,
              User_Booking_talentIdToUser: true
            }
          },
          Message: {
            include: {
              User_Message_senderIdToUser: true,
              User_Message_receiverIdToUser: true
            }
          },
          Event: {
            include: {
              User: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ])

    return {
      notifications: notifications as any as Notification[],
      total
    }
  } catch (error) {
    console.error('Error getting user notifications:', error)
    return { notifications: [], total: 0 }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    })
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    })
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}

// Generate email content based on notification type
function generateEmailContent(notification: any): { subject: string, html: string } {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.DEPLOYED_URL
  const actionLink = notification.actionUrl && baseUrl ? `${baseUrl}${notification.actionUrl}` : null

  const commonStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
      .content { background: #f9f9f9; padding: 20px; }
      .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
    </style>
  `

  const subject = `Event Talents: ${notification.title}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      ${commonStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Event Talents</h1>
          <p>Professional Event Services Platform</p>
        </div>
        <div class="content">
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${actionLink ? `<a href="${actionLink}" class="button">View Details</a>` : ''}
          <hr>
          <p><small>This notification was sent because you have email notifications enabled. You can manage your preferences in your account settings.</small></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Event Talents Platform. Professional event services in Kenya.</p>
          <p>Nairobi, Kenya | Email: support@eventtalents.co.ke</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

// Notification trigger functions for different events
export const NotificationTriggers = {
  // Message notifications
  async onMessageReceived(messageId: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          User_Message_senderIdToUser: true,
          User_Message_receiverIdToUser: true,
          Booking: {
            include: { Event: true }
          }
        }
      })

      if (!message) return

      await createNotification({
        userId: message.receiverId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: `New message from ${message.User_Message_senderIdToUser?.name}`,
        message: `You have a new message regarding "${message.Booking?.Event?.title}": ${message.content.substring(0, 100)}...`,
        actionUrl: `/${message.User_Message_receiverIdToUser?.role?.toLowerCase()}/messages?booking=${message.bookingId}`,
        messageId: message.id,
        bookingId: message.bookingId
      })
    } catch (error) {
      console.error('Error triggering message notification:', error)
    }
  },

  // Booking notifications
  async onBookingRequest(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          User_Booking_organizerIdToUser: true,
          User_Booking_talentIdToUser: true,
          Event: true
        }
      })

      if (!booking) return

      await createNotification({
        userId: booking.talentId,
        type: NotificationType.BOOKING_REQUEST,
        title: `New booking request for ${booking.Event?.title}`,
        message: `${booking.User_Booking_organizerIdToUser?.name} has sent you a booking request for "${booking.Event?.title}" on ${booking.Event?.eventDate.toLocaleDateString()}. Amount: KES ${booking.amount.toLocaleString()}`,
        actionUrl: `/talent/bookings/${booking.id}`,
        bookingId: booking.id,
        eventId: booking.eventId
      })
    } catch (error) {
      console.error('Error triggering booking request notification:', error)
    }
  },

  async onBookingAccepted(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          User_Booking_organizerIdToUser: true,
          User_Booking_talentIdToUser: true,
          Event: true
        }
      })

      if (!booking) return

      await createNotification({
        userId: booking.organizerId,
        type: NotificationType.BOOKING_ACCEPTED,
        title: `Booking accepted by ${booking.User_Booking_talentIdToUser?.name}`,
        message: `Great news! ${booking.User_Booking_talentIdToUser?.name} has accepted your booking request for "${booking.Event?.title}". You can now proceed with payment.`,
        actionUrl: `/organizer/bookings/${booking.id}`,
        bookingId: booking.id
      })
    } catch (error) {
      console.error('Error triggering booking accepted notification:', error)
    }
  },

  async onBookingDeclined(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          User_Booking_organizerIdToUser: true,
          User_Booking_talentIdToUser: true,
          Event: true
        }
      })

      if (!booking) return

      await createNotification({
        userId: booking.organizerId,
        type: NotificationType.BOOKING_DECLINED,
        title: `Booking declined by ${booking.User_Booking_talentIdToUser?.name}`,
        message: `${booking.User_Booking_talentIdToUser?.name} has declined your booking request for "${booking.Event?.title}". You can search for other talents or modify your request.`,
        actionUrl: `/organizer/bookings/${booking.id}`,
        bookingId: booking.id
      })
    } catch (error) {
      console.error('Error triggering booking declined notification:', error)
    }
  },

  async onPaymentConfirmed(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          User_Booking_organizerIdToUser: true,
          User_Booking_talentIdToUser: true,
          Event: true
        }
      })

      if (!booking) return

      // Notify talent about payment confirmation
      await createNotification({
        userId: booking.talentId,
        type: NotificationType.BOOKING_PAYMENT_CONFIRMED,
        title: `Payment confirmed for ${booking.Event?.title}`,
        message: `Payment of KES ${booking.amount.toLocaleString()} has been confirmed for your booking. The event is scheduled for ${booking.Event?.eventDate.toLocaleDateString()}.`,
        actionUrl: `/talent/bookings/${booking.id}`,
        bookingId: booking.id
      })
    } catch (error) {
      console.error('Error triggering payment confirmation notification:', error)
    }
  },

  async onPayoutProcessed(payoutId: string) {
    try {
      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
        include: {
          User: true,
          Booking: {
            include: { Event: true }
          }
        }
      })

      if (!payout) return

      await createNotification({
        userId: payout.talentId,
        type: NotificationType.PAYOUT_PROCESSED,
        title: `Payout processed - KES ${payout.amount.toLocaleString()}`,
        message: `Your payout of KES ${payout.amount.toLocaleString()} has been processed and sent to your M-Pesa account.`,
        actionUrl: `/talent/payouts`,
        bookingId: payout.bookingId || undefined
      })
    } catch (error) {
      console.error('Error triggering payout notification:', error)
    }
  },

  async onReviewReceived(reviewId: string) {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          User_Review_giverIdToUser: true,
          User_Review_receiverIdToUser: true,
          Booking: {
            include: { Event: true }
          }
        }
      })

      if (!review) return

      await createNotification({
        userId: review.receiverId,
        type: NotificationType.REVIEW_RECEIVED,
        title: `New ${review.rating}-star review received`,
        message: `${review.User_Review_giverIdToUser?.name} left you a ${review.rating}-star review for "${review.Booking?.Event?.title}": "${review.comment?.substring(0, 100) || 'No comment provided'}"`,
        actionUrl: `/${review.User_Review_receiverIdToUser?.role?.toLowerCase()}/reviews`,
        bookingId: review.bookingId
      })
    } catch (error) {
      console.error('Error triggering review notification:', error)
    }
  },

  async onEventReminder(eventId: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          User: true,
          Booking: {
            where: { status: BookingStatus.ACCEPTED },
            include: { User_Booking_talentIdToUser: true }
          }
        }
      })

      if (!event) return

      // Notify organizer
      await createNotification({
        userId: event.organizerId,
        type: NotificationType.EVENT_REMINDER,
        title: `Event reminder: ${event.title}`,
        message: `Your event "${event.title}" is scheduled for tomorrow (${event.eventDate.toLocaleDateString()}). Make sure everything is ready!`,
        actionUrl: `/organizer/events/${event.id}`,
        eventId: event.id
      })

      // Notify all booked talents
      for (const booking of event.Booking) {
        await createNotification({
          userId: booking.talentId,
          type: NotificationType.EVENT_REMINDER,
          title: `Event reminder: ${event.title}`,
          message: `You have an event tomorrow: "${event.title}" at ${event.location}. Event time: ${event.eventDate.toLocaleString()}.`,
          actionUrl: `/talent/bookings/${booking.id}`,
          bookingId: booking.id,
          eventId: event.id
        })
      }
    } catch (error) {
      console.error('Error triggering event reminder notifications:', error)
    }
  },

  async onBookingCompleted(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          User_Booking_organizerIdToUser: true,
          User_Booking_talentIdToUser: true,
          Event: true
        }
      })

      if (!booking) return

      // Notify organizer
      await createNotification({
        userId: booking.organizerId,
        type: NotificationType.BOOKING_COMPLETED,
        title: `Event completed: ${booking.Event?.title}`,
        message: `Your event "${booking.Event?.title}" has been marked as completed. You can now leave a review for ${booking.User_Booking_talentIdToUser?.name}.`,
        actionUrl: `/organizer/bookings/${booking.id}`,
        bookingId: booking.id
      })
    } catch (error) {
      console.error('Error triggering booking completion notification:', error)
    }
  },

  // Admin notifications
  async onUserRegistration(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          TalentProfile: true,
          OrganizerProfile: true
        }
      })

      if (!user) return

      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN }
      })

      // Notify all admins
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: NotificationType.ADMIN_USER_REGISTRATION,
          title: `New ${user.role.toLowerCase()} registered`,
          message: `${user.name} (${user.email}) has registered as a ${user.role.toLowerCase()} on the platform.`,
          actionUrl: `/admin/users?search=${user.email}`
        })
      }
    } catch (error) {
      console.error('Error triggering user registration notification:', error)
    }
  },

  // Dispute notifications
  async onDisputeCreated(disputeId: string) {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          Booking: {
            include: {
              Event: true,
              User_Booking_organizerIdToUser: true,
              User_Booking_talentIdToUser: true
            }
          },
          User: true
        }
      })

      if (!dispute || !dispute.Booking) return

      const isOrganizer = dispute.disputedById === dispute.Booking.organizerId
      const otherUserId = isOrganizer ? dispute.Booking.talentId : dispute.Booking.organizerId
      const otherUserRole = isOrganizer ? 'talent' : 'organizer'

      // Notify the other party
      await createNotification({
        userId: otherUserId,
        type: NotificationType.DISPUTE_CREATED,
        title: 'Dispute Raised',
        message: `A dispute has been raised for booking "${dispute.Booking.Event?.title}" by ${dispute.User?.name}. Reason: ${dispute.reason.replace(/_/g, ' ')}`,
        bookingId: dispute.bookingId,
        actionUrl: `/${otherUserRole}/disputes/${dispute.id}`,
      })

      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      })

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: NotificationType.DISPUTE_CREATED,
          title: 'New Dispute Requires Review',
          message: `A dispute has been raised for "${dispute.Booking.Event?.title}" by ${dispute.User?.name} (${dispute.User?.role}). Reason: ${dispute.reason.replace(/_/g, ' ')}`,
          bookingId: dispute.bookingId,
          actionUrl: `/admin/disputes/${dispute.id}`,
        })
      }
    } catch (error) {
      console.error('Error triggering dispute created notification:', error)
    }
  },

  async onDisputeResolved(disputeId: string) {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          Booking: {
            include: {
              Event: true,
              User_Booking_organizerIdToUser: true,
              User_Booking_talentIdToUser: true
            }
          },
          User: true
        }
      })

      if (!dispute || !dispute.Booking) return

      const resolutionMessage = `Your dispute for booking "${dispute.Booking.Event?.title}" has been resolved by admin. ${dispute.resolutionNotes ? `Resolution: ${dispute.resolutionNotes}` : ''}`

      // Notify both parties
      await Promise.all([
        // Notify organizer
        createNotification({
          userId: dispute.Booking.organizerId,
          type: NotificationType.DISPUTE_RESOLVED,
          title: 'Dispute Resolved',
          message: resolutionMessage,
          bookingId: dispute.bookingId,
          actionUrl: '/organizer/disputes'
        }),
        
        // Notify talent
        createNotification({
          userId: dispute.Booking.talentId,
          type: NotificationType.DISPUTE_RESOLVED,
          title: 'Dispute Resolved',
          message: resolutionMessage,
          bookingId: dispute.bookingId,
          actionUrl: '/talent/disputes'
        })
      ])
    } catch (error) {
      console.error('Error triggering dispute resolved notification:', error)
    }
  },

  // KYC notifications
  async onKycSubmitted(submissionId: string) {
    try {
      const submission = await prisma.kycSubmission.findUnique({
        where: { id: submissionId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          KycDocument: {
            select: {
              id: true,
              documentType: true,
            },
          },
        },
      })

      if (!submission) return

      const userName = submission.User.name || submission.User.email || 'Unknown User'
      const userRole = submission.User.role || 'USER'
      const documentCount = submission.KycDocument.length

      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      })

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: NotificationType.ADMIN_USER_REGISTRATION,
          title: 'New KYC Submission',
          message: `${userName} (${userRole}) has submitted KYC documents for review. ${documentCount} document(s) uploaded.`,
          actionUrl: `/admin/kyc-submissions`,
        })
      }
    } catch (error) {
      console.error('Error triggering KYC submission notification:', error)
    }
  },

  async onKycApproved(submissionId: string) {
    try {
      const submission = await prisma.kycSubmission.findUnique({
        where: { id: submissionId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      })

      if (!submission) return

      const userRole = submission.User.role.toLowerCase()

      await createNotification({
        userId: submission.userId,
        type: NotificationType.ADMIN_USER_REGISTRATION, // Using closest available type
        title: 'Identity Verification Approved',
        message: `Congratulations! Your identity verification has been approved. You now have full access to all platform features including payouts.`,
        actionUrl: `/${userRole}/settings/verification`,
      })
    } catch (error) {
      console.error('Error triggering KYC approval notification:', error)
    }
  },

  async onKycRejected(submissionId: string, rejectionReason: string, adminNotes?: string) {
    try {
      const submission = await prisma.kycSubmission.findUnique({
        where: { id: submissionId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      })

      if (!submission) return

      const userRole = submission.User.role.toLowerCase()
      const notesText = adminNotes ? ` Additional notes: ${adminNotes}` : ''

      await createNotification({
        userId: submission.userId,
        type: NotificationType.ADMIN_USER_REGISTRATION, // Using closest available type
        title: 'Identity Verification Rejected',
        message: `Your identity verification has been rejected. Reason: ${rejectionReason}.${notesText} Please resubmit with correct documents.`,
        actionUrl: `/${userRole}/settings/verification`,
      })
    } catch (error) {
      console.error('Error triggering KYC rejection notification:', error)
    }
  }
}
