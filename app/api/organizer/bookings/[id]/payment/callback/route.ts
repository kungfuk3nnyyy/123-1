

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, TransactionStatus, BookingStatus, NotificationType } from '@prisma/client'

export const dynamic = 'force-dynamic'
console.log('🔄 Callback route accessed:', new Date().toISOString())

// Handle Paystack webhook notifications (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    
    // Verify webhook signature in production
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('test')) {
      const crypto = require('crypto')
      const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(body).digest('hex')
      
      if (hash !== signature) {
        console.log('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    console.log('📨 Webhook received:', event.event)

    if (event.event === 'charge.success') {
      const reference = event.data.reference
      await processPaymentSuccess(reference, 'webhook')
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Shared function to process payment success
export async function processPaymentSuccess(reference: string, source: 'webhook' | 'redirect') {
  console.log(`🔍 Processing payment success from ${source} for reference:`, reference)

  // Find transaction by reference with enhanced error handling
  const transaction = await prisma.transaction.findFirst({
    where: { 
      paystackRef: reference 
    },
    include: {
      Booking: {
        include: {
          User_Booking_talentIdToUser: true,
          User_Booking_organizerIdToUser: true,
          Event: true
        }
      }
    }
  })

  if (!transaction) {
    console.log('❌ Transaction not found for reference:', reference)
    throw new Error(`Transaction not found for reference: ${reference}`)
  }

  // Check if transaction is already completed
  if (transaction.status === TransactionStatus.COMPLETED) {
    console.log('✅ Transaction already completed')
    return { success: true, message: 'Transaction already completed', transaction, booking: transaction.Booking }
  }

  // Verify payment with Paystack (or simulate in test mode)
  let verificationResult
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

  if (PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('test')) {
    // LIVE MODE: Verify with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    verificationResult = await verifyResponse.json()
    
    if (!verificationResult.status || verificationResult.data.status !== 'success') {
      console.log('❌ Payment verification failed:', verificationResult)
      throw new Error('Payment verification failed')
    }
  } else {
    // TEST MODE: Simulate successful payment
    console.log('🧪 TEST MODE: Simulating successful payment verification...')
    verificationResult = {
      status: true,
      message: 'Verification successful',
      data: {
        id: transaction.id,
        status: 'success',
        reference: reference,
        amount: Number(transaction.amount) * 100,
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        created_at: transaction.createdAt.toISOString(),
        channel: 'card',
        currency: 'KES',
        authorization: {
          authorization_code: 'AUTH_test123',
          bin: '408408',
          last4: '4081',
          exp_month: '12',
          exp_year: '2030',
          channel: 'card',
          card_type: 'visa DEBIT',
          bank: 'Test Bank',
          country_code: 'KE',
          brand: 'visa'
        },
        customer: {
          id: transaction.userId,
          email: transaction.Booking.User_Booking_organizerIdToUser.email
        }
      }
    }
  }

  // Use database transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update transaction status
    const updatedTransaction = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.COMPLETED,
        paystackData: verificationResult.data,
        updatedAt: new Date()
      }
    })

    // Update booking status to IN_PROGRESS (Step 3: Event Scheduled)
    const updatedBooking = await tx.booking.update({
      where: { id: transaction.bookingId },
      data: { 
        status: BookingStatus.IN_PROGRESS,
        // Using acceptedDate to track when payment was made
        acceptedDate: new Date(),
        updatedAt: new Date()
      }
    })

    // Create activity log for organizer
    await tx.activity.create({
      data: {
        userId: transaction.userId,
        type: 'BOOKING_PAYMENT_COMPLETED',
        description: `Payment completed for booking with ${transaction.Booking.User_Booking_talentIdToUser.name}`,
        metadata: { 
          bookingId: transaction.bookingId, 
          transactionId: transaction.id,
          amount: transaction.amount,
          step: 3,
          source
        }
      }
    })

    return { updatedTransaction, updatedBooking }
  })

  // Send notifications (outside of transaction for better performance)
  try {
    // Notify talent about payment confirmation
    await prisma.notification.create({
      data: {
        userId: transaction.Booking.User_Booking_talentIdToUser.id,
        type: NotificationType.BOOKING_PAYMENT_CONFIRMED,
        title: 'Payment Confirmed',
        message: `Payment has been confirmed for "${transaction.Booking.Event.title}". The event is now officially scheduled!`,
        bookingId: transaction.bookingId,
        actionUrl: `/talent/bookings/${transaction.bookingId}`
      }
    })

    // Notify organizer about successful payment
    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        type: NotificationType.BOOKING_PAYMENT_CONFIRMED,
        title: 'Payment Successful',
        message: `Your payment for "${transaction.Booking.Event.title}" has been processed successfully. The event is now scheduled!`,
        bookingId: transaction.bookingId,
        actionUrl: `/organizer/bookings/${transaction.bookingId}`
      }
    })
  } catch (notificationError) {
    console.error('⚠️ Failed to send notifications:', notificationError)
    // Don't fail the entire process for notification errors
  }

  console.log('✅ Payment processing completed successfully')
  return { success: true, transaction: result.updatedTransaction, booking: result.updatedBooking }
}

// Handle redirect callback from payment gateway (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    const bookingId = searchParams.get('booking_id') // Extract booking ID from callback URL

    console.log('🔄 Payment callback received with params:', {
      reference,
      bookingId,
      allParams: Object.fromEntries(searchParams.entries())
    })

    if (!reference) {
      console.log('❌ No payment reference provided')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/organizer/bookings?error=invalid_payment_reference`)
    }

    // AUTOMATIC VERIFICATION: Process payment immediately in callback
    try {
      console.log('🔄 Starting automatic payment verification...')
      const result = await processPaymentSuccess(reference, 'redirect')
      
      if (!result.success) {
        throw new Error('Payment processing was not successful')
      }

      // Ensure we have the booking ID
      const successBookingId = result.booking?.id || bookingId
      if (!successBookingId) {
        throw new Error('No booking ID available for redirect')
      }
      
      // Build success URL with verification status
      const successParams = new URLSearchParams()
      successParams.append('payment_status', 'verified')
      successParams.append('verification_source', 'automatic')
      successParams.append('step', '3')
      if (result.transaction?.amount) {
        successParams.append('amount', result.transaction.amount.toString())
      }
      
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organizer/bookings/${successBookingId}?${successParams.toString()}`
      console.log('✅ Automatic verification successful, redirecting to:', successUrl)
      
      // Use 303 See Other to ensure the browser follows the redirect with a GET request
      return new NextResponse(null, {
        status: 303,
        headers: {
          Location: successUrl
        }
      })
      
    } catch (processError) {
      console.error('❌ Automatic payment verification failed:', processError)
      
      // If automatic verification fails, redirect to booking page with pending status
      // The frontend will handle manual verification
      const errorParams = new URLSearchParams()
      errorParams.append('payment_status', 'pending')
      errorParams.append('verification_source', 'failed_automatic')
      errorParams.append('reference', reference)
      errorParams.append('step', '2')
      
      const pendingUrl = bookingId 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/organizer/bookings/${bookingId}?${errorParams.toString()}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/organizer/bookings?${errorParams.toString()}`
      
      console.log('⚠️ Automatic verification failed, redirecting to pending state:', pendingUrl)
      
      return new NextResponse(null, {
        status: 303,
        headers: {
          Location: pendingUrl
        }
      })
    }

  } catch (error) {
    console.error('❌ Payment callback error:', error)
    
    // Fallback error URL
    const fallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organizer/bookings?error=payment_processing_failed`
    
    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: fallbackUrl
      }
    })
  }
}

