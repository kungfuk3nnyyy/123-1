
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/disputes
 * Fetches all disputes related to the currently logged-in user (talent or organizer).
 * Enhanced to include complete user data for both organizers and talents.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id;

  try {
    const disputes = await prisma.dispute.findMany({
      where: {
        Booking: {
          OR: [
            { organizerId: userId },
            { talentId: userId },
          ],
        },
      },
      include: {
        Booking: {
          include: {
            Event: {
              select: { 
                id: true,
                title: true,
                eventDate: true,
                location: true
              },
            },
            User_Booking_organizerIdToUser: { // Organizer
              select: { 
                id: true, 
                name: true, 
                email: true,
                image: true 
              },
            },
            User_Booking_talentIdToUser: { // Talent
              select: { 
                id: true, 
                name: true, 
                email: true,
                image: true 
              },
            },
            Transaction: {
              select: {
                amount: true,
                status: true,
                type: true
              },
              orderBy: { createdAt: 'desc' }
            }
          },
        },
        User: { // The user who raised the dispute
          select: { 
            id: true, 
            name: true,
            email: true,
            role: true
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include complete information
    const transformedDisputes = disputes.map(dispute => ({
      ...dispute,
      // Add computed fields for easier frontend consumption
      eventTitle: dispute.Booking?.Event?.title || 'N/A',
      eventDate: dispute.Booking?.Event?.eventDate || null,
      eventLocation: dispute.Booking?.Event?.location || 'N/A',
      organizerName: dispute.Booking?.User_Booking_organizerIdToUser?.name || 'N/A',
      organizerEmail: dispute.Booking?.User_Booking_organizerIdToUser?.email || 'N/A',
      talentName: dispute.Booking?.User_Booking_talentIdToUser?.name || 'N/A',
      talentEmail: dispute.Booking?.User_Booking_talentIdToUser?.email || 'N/A',
      disputedByName: dispute.User?.name || 'N/A',
      disputedByRole: dispute.User?.role || 'N/A',
      bookingAmount: dispute.Booking?.Transaction?.[0]?.amount ? Number(dispute.Booking.Transaction[0].amount) : 0
    }));

    return NextResponse.json({ success: true, data: transformedDisputes });
  } catch (error) {
    console.error('Failed to fetch disputes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
