
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, TransactionStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Only organizers can initiate payments' }, { status: 401 })
    }

    const bookingId = params.id

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        organizerId: session.user.id
      },
      include: {
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Event: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    if (booking.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Can only pay for accepted bookings' },
        { status: 400 }
      )
    }

    // Initialize Paystack payment
    const amount = Number(booking.amount) * 100 // Convert to kobo
    const paymentReference = `booking_${bookingId}_${Date.now()}`
    const paystackData = {
      email: session.user.email,
      amount,
      currency: 'KES',
      reference: paymentReference,
      callback_url: `https://dooonda.co.ke/booking/success?booking_id=${booking.id}`,
      metadata: {
        booking_id: booking.id,
        event_title: booking.Event.title,
        talent_name: booking.User_Booking_talentIdToUser.name,
        organizer_id: session.user.id,
        step: 2 // Payment step in 4-step process
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money']
    }

    // Initialize Paystack payment (LIVE)
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY env variable is not set')
      return NextResponse.json({ error: 'Payment service unavailable' }, { status: 500 })
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackData)
    })

    const paystackResult = await paystackResponse.json()

    if (!paystackResult.status) {
      console.error('Paystack initialization failed:', paystackResult)
      return NextResponse.json({ error: 'Paystack error', details: paystackResult }, { status: 500 })
    }

    console.log('✅ Paystack initialization successful:', paystackResult)

    // Create transaction record with metadata included in paystackData
    const transactionData = {
      bookingId: booking.id,
      userId: session.user.id,
      type: 'BOOKING_PAYMENT',
      status: TransactionStatus.PENDING,
      amount: Number(booking.amount),
      currency: 'KES',
      paystackRef: paystackResult.data.reference,
      paystackData: {
        ...paystackResult.data,
        metadata: {
          step: 2,
          booking_id: booking.id,
          organizer_id: session.user.id,
          event_title: booking.Event.title,
          talent_name: booking.User_Booking_talentIdToUser.name
        }
      },
      description: `Payment for ${booking.Event.title}`
    }

    await prisma.transaction.create({
      data: transactionData
    })

    return NextResponse.json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: paystackResult.data.authorization_url,
        reference: paystackResult.data.reference,
        amount: Number(booking.amount)
      }
    })

  } catch (error) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
