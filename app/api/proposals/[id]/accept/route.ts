
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the proposal with event details
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
            eventDate: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if user is the event organizer
    if (proposal.Event.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to accept this proposal' },
        { status: 403 }
      );
    }

    // Check if proposal is still pending
    if (proposal.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Proposal is no longer pending' },
        { status: 400 }
      );
    }

    // Start transaction to accept proposal and create booking
    const result = await prisma.$transaction(async (tx) => {
      // Accept the proposal
      const acceptedProposal = await tx.proposal.update({
        where: { id: params.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Reject all other proposals for this event
      await tx.proposal.updateMany({
        where: {
          eventId: proposal.Event.id,
          id: { not: params.id },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
        },
      });

      // Calculate platform fee (assuming 10% platform fee)
      const amount = proposal.quoteAmountKes;
      const platformFeeRate = 0.10; // 10%
      const platformFee = amount.mul(platformFeeRate);
      const talentAmount = amount.sub(platformFee);

      // Create booking
      const booking = await tx.booking.create({
        data: {
          eventId: proposal.Event.id,
          organizerId: proposal.Event.organizerId,
          talentId: proposal.talentId,
          amount: amount,
          platformFee: platformFee,
          talentAmount: talentAmount,
          status: 'PENDING', // Organizer still needs to pay
          proposedDate: proposal.Event.eventDate,
          notes: `Booking created from accepted proposal: ${proposal.message.substring(0, 100)}...`,
        },
      });

      return { acceptedProposal, booking };
    });

    // TODO: Create notifications
    // await createNotification({
    //   userId: proposal.talentId,
    //   type: 'PROPOSAL_ACCEPTED',
    //   title: 'Proposal Accepted!',
    //   message: `Your proposal for "${proposal.Event.title}" has been accepted`,
    //   bookingId: result.booking.id,
    // });

    return NextResponse.json({
      message: 'Proposal accepted and booking created',
      proposal: result.acceptedProposal,
      booking: result.booking,
    });
  } catch (error) {
    console.error('Error accepting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to accept proposal' },
      { status: 500 }
    );
  }
}
