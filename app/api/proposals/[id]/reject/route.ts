
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
        { error: 'Unauthorized to reject this proposal' },
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

    // Reject the proposal
    const rejectedProposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });

    // TODO: Create notification for talent
    // await createNotification({
    //   userId: proposal.talentId,
    //   type: 'PROPOSAL_REJECTED',
    //   title: 'Proposal Rejected',
    //   message: `Your proposal for "${proposal.Event.title}" has been rejected`,
    //   eventId: proposal.Event.id,
    // });

    return NextResponse.json({
      message: 'Proposal rejected successfully',
      proposal: rejectedProposal,
    });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to reject proposal' },
      { status: 500 }
    );
  }
}
