
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
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

    // Check if user is the event organizer
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view proposals for this event' },
        { status: 403 }
      );
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        eventId: params.id,
      },
      include: {
        Talent: {
          select: {
            id: true,
            name: true,
            image: true,
            TalentProfile: {
              select: {
                bio: true,
                averageRating: true,
                totalReviews: true,
                totalBookings: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

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

    // Check if user is a talent
    if (session.user.role !== 'TALENT') {
      return NextResponse.json(
        { error: 'Only talents can submit proposals' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { quoteAmountKes, message } = body;

    // Validation
    if (!quoteAmountKes || !message) {
      return NextResponse.json(
        { error: 'Quote amount and message are required' },
        { status: 400 }
      );
    }

    if (quoteAmountKes <= 0) {
      return NextResponse.json(
        { error: 'Quote amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if event exists and is published
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        status: true, 
        organizerId: true,
        isActive: true 
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== 'PUBLISHED' || !event.isActive) {
      return NextResponse.json(
        { error: 'Event is not available for proposals' },
        { status: 400 }
      );
    }

    // Check if talent is trying to apply to their own event
    if (event.organizerId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot submit a proposal to your own event' },
        { status: 400 }
      );
    }

    // Check if talent has already submitted a proposal
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        eventId_talentId: {
          eventId: params.id,
          talentId: session.user.id,
        },
      },
    });

    if (existingProposal) {
      return NextResponse.json(
        { error: 'You have already submitted a proposal for this event' },
        { status: 400 }
      );
    }

    // Create proposal
    const proposal = await prisma.proposal.create({
      data: {
        eventId: params.id,
        talentId: session.user.id,
        quoteAmountKes: parseFloat(quoteAmountKes),
        message,
      },
      include: {
        Talent: {
          select: {
            id: true,
            name: true,
            image: true,
            TalentProfile: {
              select: {
                bio: true,
                averageRating: true,
                totalReviews: true,
                totalBookings: true,
              },
            },
          },
        },
        Event: {
          select: {
            title: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // TODO: Create notification for event organizer
    // await createNotification({
    //   userId: event.organizerId,
    //   type: 'PROPOSAL_RECEIVED',
    //   title: 'New Proposal Received',
    //   message: `${session.user.name} submitted a proposal for your event`,
    //   eventId: params.id,
    // });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to submit proposal' },
      { status: 500 }
    );
  }
}
