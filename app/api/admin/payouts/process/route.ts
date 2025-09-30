import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, BookingStatus, PayoutStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '@/lib/notification-service'
import { NotificationType } from '@prisma/client'

// Paystack API endpoints
const PAYSTACK_RECIPIENT_LIST_URL = 'https://api.paystack.co/transferrecipient?page=1&perPage=50'
const PAYSTACK_CREATE_RECIPIENT_URL = 'https://api.paystack.co/transferrecipient'
const PAYSTACK_INITIATE_TRANSFER_URL = 'https://api.paystack.co/transfer'
const PAYSTACK_VERIFY_TRANSFER_URL = 'https://api.paystack.co/transfer/verify/'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Get booking details with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Event: {
          select: {
            title: true,
            eventDate: true
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Only completed bookings can have payouts processed' },
        { status: 400 }
      )
    }

    if (booking.isPaidOut) {
      return NextResponse.json(
        { error: 'Payout has already been processed for this booking' },
        { status: 400 }
      )
    }

    const talentProfile = booking.User_Booking_talentIdToUser.TalentProfile
    if (!talentProfile?.mpesaPhoneNumber) {
      return NextResponse.json({ 
        error: 'Talent has not configured their M-Pesa number. Please ask them to update their payment settings.' 
      }, { status: 400 })
    }

    // CRITICAL KYC CHECK: Only verified talents can receive payouts
    if (booking.User_Booking_talentIdToUser.verificationStatus !== 'VERIFIED') {
      return NextResponse.json({ 
        error: `Payout blocked: Talent verification required. Current status: ${booking.User_Booking_talentIdToUser.verificationStatus}. The talent must complete KYC verification to receive payouts.`,
        requiresKyc: true,
        talentVerificationStatus: booking.User_Booking_talentIdToUser.verificationStatus
      }, { status: 400 })
    }

    // --- Corrected phone number formatting logic for Paystack ---
    let formattedMpesaNumber = talentProfile.mpesaPhoneNumber
    if (formattedMpesaNumber.startsWith('+254')) {
      // Remove '+' and prepend '0'
      formattedMpesaNumber = '0' + formattedMpesaNumber.slice(4)
    } else if (formattedMpesaNumber.startsWith('254')) {
      // Prepend '0'
      formattedMpesaNumber = '0' + formattedMpesaNumber.slice(3);
    }
    // Now, if the number starts with '0', we do nothing, which is the correct format for Paystack.

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
        return NextResponse.json({ error: 'Paystack secret key is not set' }, { status: 500 });
    }

    // Calculate payout amount
    const totalAmount = Number(booking.amount)
    const platformFee = Number(booking.platformFee)
    const payoutAmount = totalAmount - platformFee
    const payoutAmountInKobo = Math.round(payoutAmount * 100) // Convert to kobo/cents

    // --- Paystack Integration ---
    try {
      console.log('🚀 Starting payout process...');
      let recipientCode: string | null = null;
      let transferResponseData: any;
      
      console.log('🔍 Booking details:', {
        bookingId,
        talentId: booking.talentId,
        amount: payoutAmount,
        mpesaNumber: formattedMpesaNumber
      });

      // 1. Fetch existing recipient
      console.log('🔍 Checking for existing recipient...');
      const existingRecipientsResponse = await fetch(PAYSTACK_RECIPIENT_LIST_URL, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const existingRecipients = await existingRecipientsResponse.json();
      console.log('📋 Existing recipients response:', {
        status: existingRecipientsResponse.status,
        hasData: !!existingRecipients.data,
        count: existingRecipients.data?.length || 0
      });

      if (existingRecipients.data) {
        const foundRecipient = existingRecipients.data.find(
          (r: any) => r.details.account_number === formattedMpesaNumber
        );
        if (foundRecipient) {
          recipientCode = foundRecipient.recipient_code;
        }
      }

      // 2. Create recipient if not found
      if (!recipientCode) {
        console.log('➕ Creating new recipient...');
        const createRecipientResponse = await fetch(PAYSTACK_CREATE_RECIPIENT_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'mpesa',
            name: booking.User_Booking_talentIdToUser.name || 'Talent',
            account_number: formattedMpesaNumber,
            bank_code: 'MPESA',
            currency: 'KES',
          }),
        });

        const newRecipientData = await createRecipientResponse.json();

        if (!createRecipientResponse.ok || !newRecipientData.status) {
          throw new Error(newRecipientData.message || 'Failed to create transfer recipient on Paystack');
        }

        recipientCode = newRecipientData.data.recipient_code;
      }

      const transferReference = uuidv4();

      // 3. Initiate the transfer
      console.log('💰 Initiating transfer...', {
        amount: payoutAmountInKobo,
        recipient: recipientCode,
        reference: transferReference
      });
      
      const initiateTransferResponse = await fetch(PAYSTACK_INITIATE_TRANSFER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: payoutAmountInKobo,
          recipient: recipientCode,
          reason: `Payout for ${booking.Event.title} - Booking #${bookingId}`,
          currency: 'KES',
          reference: transferReference,
        }),
      });

      const initiateTransferData = await initiateTransferResponse.json();
      console.log('📤 Transfer initiation response:', {
        status: initiateTransferResponse.status,
        data: initiateTransferData,
        success: initiateTransferData.status === true
      });

      if (!initiateTransferResponse.ok || !initiateTransferData.status) {
        throw new Error(initiateTransferData.message || 'Paystack transfer failed');
      }

      // 4. Verify the transfer
      const transferCode = initiateTransferData.data.transfer_code;
      console.log('🔍 Verifying transfer...', { transferCode });
      
      const verifyTransferResponse = await fetch(`${PAYSTACK_VERIFY_TRANSFER_URL}${transferCode}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      });
      const verifyTransferData = await verifyTransferResponse.json();
      console.log('✅ Transfer verification response:', {
        status: verifyTransferResponse.status,
        transferStatus: verifyTransferData.data?.status,
        message: verifyTransferData.message
      });
      
      transferResponseData = verifyTransferData.data;

      // Update booking as paid out
      console.log('📝 Updating booking as paid out...');
      await prisma.booking.update({
        where: { id: bookingId },
        data: { isPaidOut: true }
      });
      console.log('✅ Booking marked as paid out');

      // Create payout record
      console.log('📝 Creating payout record...');
      await prisma.payout.create({
        data: {
          talentId: booking.talentId,
          bookingId: bookingId,
          amount: payoutAmount,
          status: PayoutStatus.PENDING,
          transferCode: transferCode,
          transferData: {
            ...(transferResponseData || {}),
            transactionRef: transferReference // Store the transaction reference in transferData
          },
          mpesaNumber: formattedMpesaNumber,
        }
      });
      
      // Notify talent of the payout
      console.log('📧 Creating payout notification for talent...');
      await createNotification({
        userId: booking.talentId,
        type: 'PAYOUT_PROCESSED',
        title: 'Payout Initiated',
        message: `A payout of KES ${payoutAmount.toLocaleString()} has been initiated for your booking.`,
        bookingId: bookingId
      })

      // Log success
      console.log('🎉 Payout processed successfully!', {
        bookingId,
        amount: payoutAmount,
        transferCode,
        status: verifyTransferData.data?.status
      });

      // Return success response with Paystack details
      return NextResponse.json({
        success: true,
        message: 'Payout successfully initiated and verified via Paystack.',
        data: {
          bookingId,
          amount: payoutAmount,
          transferCode: transferCode,
          status: verifyTransferData.data.status,
          recipientNumber: formattedMpesaNumber,
          reference: transferReference,
        }
      });
    } catch (error) {
      console.error('❌ Paystack transfer error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        error: 'Paystack transfer failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Payout processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process payout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pending payouts (bookings that are completed but not paid out)
    const pendingPayouts = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        isPaidOut: false,
        Event: {
          eventDate: {
            lt: new Date() // Only past events
          }
        }
      },
      include: {
        User_Booking_talentIdToUser: {
          include: {
            TalentProfile: true
          }
        },
        Event: {
          select: {
            title: true,
            eventDate: true
          }
        },
        User_Booking_organizerIdToUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { completedDate: 'desc' },
      take: 20
    })

    // Get recent payouts (already processed)
    const recentPayouts = await prisma.payout.findMany({
      include: {
        User: {
          select: {
            name: true,
            email: true
          }
        },
        Booking: {
          include: {
            Event: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      data: {
        pendingPayouts: pendingPayouts.map(booking => ({
          id: booking.id,
          amount: Number(booking.amount) - Number(booking.platformFee || 0),
          talent: {
            id: booking.talentId,
            name: booking.User_Booking_talentIdToUser.name,
            email: booking.User_Booking_talentIdToUser.email,
            verificationStatus: booking.User_Booking_talentIdToUser.verificationStatus,
            talentProfile: {
              mpesaPhoneNumber: booking.User_Booking_talentIdToUser.TalentProfile?.mpesaPhoneNumber || null,
              mpesaVerified: booking.User_Booking_talentIdToUser.TalentProfile?.mpesaVerified || false
            }
          },
          event: {
            title: booking.Event?.title || 'Unknown Event',
            eventDate: booking.Event?.eventDate?.toISOString() || new Date().toISOString()
          },
          organizer: {
            name: booking.User_Booking_organizerIdToUser?.name || 'Unknown Organizer',
            email: booking.User_Booking_organizerIdToUser?.email || ''
          },
          completedDate: booking.completedDate?.toISOString() || null,
          createdAt: booking.createdAt.toISOString()
        })),
        recentPayouts: recentPayouts.map(payout => ({
          id: payout.id,
          amount: Number(payout.amount),
          status: payout.status,
          payoutMethod: 'M-Pesa',
          mpesaNumber: payout.mpesaNumber,
          processedAt: payout.processedAt?.toISOString() || null,
          createdAt: payout.createdAt.toISOString(),
          transactionRef: (payout.transferData as any)?.transactionRef || null, // Get transactionRef from transferData
          talent: {
            name: payout.User?.name || 'Unknown Talent',
            email: payout.User?.email || ''
          },
          booking: payout.Booking ? {
            event: {
              title: payout.Booking.Event?.title || 'Unknown Event'
            }
          } : null
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}