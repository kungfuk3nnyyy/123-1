import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, NotificationType, BookingStatus, TransactionStatus, TransactionType } from '@prisma/client'
import { checkTalentAvailability } from '@/lib/availability'
import { withValidation } from '@/lib/security/middleware'
import { userInputSchemas, validateInput } from '@/lib/security/validation'
import { sanitizeUserInput } from '@/lib/security/sanitization'

export const dynamic = 'force-dynamic'

const postHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json({ error: 'Only organizers can create bookings' }, { status: 401 })
    }

    let bookingData;
    try {
      bookingData = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 })
    }

    // Validate and sanitize booking data
    try {
      bookingData = validateInput(userInputSchemas.booking, bookingData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Sanitize all string inputs
    bookingData = sanitizeUserInput(bookingData);

    const {
      talentId,
      packageTitle,
      eventDate,
      duration,
      venue,
      message,
      budget
    } = bookingData

    const budgetAmount = parseFloat(budget)
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      return NextResponse.json(
        { error: 'Budget must be a positive number' },
        { status: 400 }
      )
    }

    const talent = await prisma.user.findUnique({
      where: { id: talentId },
      include: { TalentProfile: true }
    })

    if (!talent || !talent.isActive || !talent.TalentProfile) {
      return NextResponse.json(
        { error: 'Talent not found or inactive' },
        { status: 404 }
      )
    }

    // Check talent availability for the requested date
    const eventDateTime = new Date(eventDate)
    const eventEndDateTime = new Date(eventDateTime.getTime() + (parseInt(duration?.split(' ')[0] || '8') * 60 * 60 * 1000))
    
    const availabilityCheck = await checkTalentAvailability(
      talentId,
      eventDateTime,
      eventEndDateTime
    )

    if (!availabilityCheck.isAvailable) {
      return NextResponse.json(
        { 
          error: 'Talent is not available for the requested date and time',
          message: availabilityCheck.message,
          conflictingEntries: availabilityCheck.conflictingEntries
        },
        { status: 409 }
      )
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        organizerId: session.user.id,
        title: packageTitle || 'Event Booking',
        description: message || 'Package booking request',
        // Corrected: Wrap the category in an array to match the schema
        category: [talent.TalentProfile.category || 'General'],
        location: venue,
        eventDate: new Date(eventDate),
        duration: parseInt(duration?.split(' ')[0] || '8'),
        budget: budgetAmount,
        isPublic: false,
        isActive: true,
      },
    })

    // Calculate platform fee (10%)
    const platformFeePercentage = 0.10
    const platformFee = budgetAmount * platformFeePercentage
    const talentAmount = budgetAmount - platformFee

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        eventId: event.id,
        organizerId: session.user.id,
        talentId,
        amount: budgetAmount,
        platformFee,
        talentAmount,
        proposedDate: new Date(eventDate),
        notes: message,
        status: BookingStatus.PENDING,
      },
      include: {
        Event: true,
        User_Booking_organizerIdToUser: true,
        User_Booking_talentIdToUser: true
      }
    })

    // Create notification for talent
    await prisma.notification.create({
      data: {
        userId: talentId,
        type: NotificationType.BOOKING_REQUEST,
        title: 'New Booking Request',
        message: `You have received a new booking request for "${packageTitle || 'Event'}" from ${session.user.name}`,
        bookingId: booking.id,
        eventId: event.id,
        actionUrl: `/talent/bookings/${booking.id}`,
      },
    })

    // Create initial transaction record
    await prisma.transaction.create({
      data: {
        bookingId: booking.id,
        userId: session.user.id,
        type: TransactionType.BOOKING_PAYMENT,
        status: TransactionStatus.PENDING,
        amount: budgetAmount,
        currency: 'KES',
        description: `Booking payment for ${packageTitle || 'Event'}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking request created successfully',
      data: {
        bookingId: booking.id,
        eventId: event.id,
        status: booking.status,
        amount: budgetAmount,
        platformFee,
        talentAmount,
      },
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export const POST = withValidation(userInputSchemas.booking)(postHandler);