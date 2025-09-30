import { NextRequest, NextResponse } from 'next/server'
import { processPaymentSuccess } from '@/lib/payment/payment-utils'

export const dynamic = 'force-dynamic'

// Handle Paystack webhook notifications (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    
    // Verify webhook signature in production
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (PAYSTACK_SECRET_KEY && !PAYSTACK_SECRET_KEY.includes('test')) {
      const crypto = require('crypto')
      const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(body)
        .digest('hex')
      
      if (hash !== signature) {
        console.log('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(body)
    console.log('📨 Webhook received:', event.event)

    if (event.event === 'charge.success') {
      const reference = event.data.reference
      const result = await processPaymentSuccess(reference, 'webhook')

      if (!result.success) {
        throw new Error(result.message || 'Failed to process payment')
      }

      console.log('✅ Payment processed successfully:', result)
      return NextResponse.json({ status: 'success' })
    }

    return NextResponse.json({ status: 'ignored' })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
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

      // Ensure we have the booking ID from either the result or the URL parameter
      const successBookingId = result.bookingId || bookingId
      if (!successBookingId) {
        throw new Error('No booking ID available for redirect')
      }
      
      // Build success URL with verification status
      const successParams = new URLSearchParams()
      successParams.append('payment_status', 'verified')
      successParams.append('verification_source', 'automatic')
      successParams.append('step', '3')
      if (result.amount) {
        successParams.append('amount', result.amount.toString())
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

