import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PayoutStatus } from '@prisma/client'

const PAYSTACK_LIST_TRANSFERS_URL = 'https://api.paystack.co/transfer'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payoutId = params.id
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Paystack secret key is not configured' },
        { status: 500 }
      )
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        Booking: true,
      }
    })

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      )
    }
    
    const listResponse = await fetch(
      PAYSTACK_LIST_TRANSFERS_URL,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const listData = await listResponse.json()
    
    console.log("Full response from Paystack list transfers API:", JSON.stringify(listData, null, 2));

    if (!listResponse.ok || !listData.status) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch transfers from Paystack',
          details: listData.message || 'Unknown error'
        },
        { status: listResponse.status }
      )
    }

    const transfer = listData.data.find(
      (t: any) => t.reason.includes(payout.bookingId)
    );

    if (!transfer) {
      return NextResponse.json(
        { error: `No Paystack transfer found for Booking ID: ${payout.bookingId}` },
        { status: 404 }
      );
    }

    const transferStatus = transfer.status?.toUpperCase()
    let newStatus: PayoutStatus = payout.status
    
    if (transferStatus === 'SUCCESS') {
      newStatus = PayoutStatus.COMPLETED
    } else if (['FAILED', 'REVERSED', 'REJECTED'].includes(transferStatus)) {
      newStatus = PayoutStatus.FAILED
    } else if (transferStatus === 'PENDING') {
      newStatus = PayoutStatus.PENDING
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: newStatus,
        transferData: transfer, // This contains the reference and all other data
        updatedAt: new Date()
      },
      include: {
        Booking: true,
        User: true
      }
    })

    if (newStatus === PayoutStatus.COMPLETED && payout.bookingId && !payout.Booking?.isPaidOut) {
      await prisma.booking.update({
        where: { id: payout.bookingId },
        data: { isPaidOut: true }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payout verification successful. Status: ${newStatus}`,
      data: {
        payout: updatedPayout,
        transferStatus: transfer.status,
      }
    })

  } catch (error) {
    console.error('❌ Payout verification error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify payout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}