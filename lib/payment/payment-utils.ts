import { prisma } from '@/lib/db'
import { BookingStatus, NotificationType, TransactionStatus } from '@prisma/client'

export async function processPaymentSuccess(reference: string, source: 'webhook' | 'redirect') {
  console.log(`🔍 Processing payment success from ${source} for reference:`, reference)

  // Find transaction by reference with enhanced error handling
  const transaction = await prisma.transaction.findFirst({
    where: { paystackRef: reference },
    include: {
      Booking: {
        include: {
          User_Booking_talentIdToUser: true,
          User_Booking_organizerIdToUser: true,
          Event: true
        }
      },
    },
  })

  if (!transaction || !transaction.Booking) {
    console.error('❌ Transaction or associated booking not found for reference:', reference)
    throw new Error('Transaction or associated booking not found')
  }

  // Check if already processed
  if (transaction.status === TransactionStatus.COMPLETED) {
    console.log('ℹ️ Transaction already processed:', reference)
    return { success: true, message: 'Already processed' }
  }

  // Get organizer and talent IDs
  const organizerId = transaction.Booking.organizerId
  const talentId = transaction.Booking.talentId

  // Update transaction status
  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: TransactionStatus.COMPLETED,
        updatedAt: new Date(),
      },
    }),
    prisma.booking.update({
      where: { id: transaction.bookingId },
      data: { status: BookingStatus.ACCEPTED }, // Using ACCEPTED instead of CONFIRMED as it's defined in your schema
    }),
  ])

  // Create notification for organizer
  await prisma.notification.create({
    data: {
      userId: organizerId,
      type: NotificationType.BOOKING_PAYMENT_CONFIRMED,
      title: 'Payment Successful',
      message: `Your payment of ${transaction.amount} for booking #${transaction.bookingId} has been processed successfully.`,
      bookingId: transaction.bookingId,
      actionUrl: `/bookings/${transaction.bookingId}`
    },
  })

  // Create notification for talent
  await prisma.notification.create({
    data: {
      userId: talentId,
      type: NotificationType.BOOKING_PAYMENT_CONFIRMED,
      title: 'Payment Received',
      bookingId: transaction.bookingId,
      actionUrl: `/bookings/${transaction.bookingId}`,
      message: `A payment of ${transaction.amount} has been received for booking #${transaction.bookingId}.`
    },
  })

  console.log('✅ Payment processed successfully for booking:', transaction.bookingId)
  return { 
    success: true,
    bookingId: transaction.bookingId,
    transactionId: transaction.id,
    amount: transaction.amount
  }
}
