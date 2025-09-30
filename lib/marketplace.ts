
import { prisma } from '@/lib/prisma';
import { Event, Proposal, TalentPackage, MarketplaceFilters } from '@/lib/types/marketplace';

export class MarketplaceService {
  // Event-related methods
  static async getEvents(filters: Partial<MarketplaceFilters> = {}) {
    const where: any = {
      status: 'PUBLISHED',
      isActive: true,
    };

    if (filters.category) {
      where.category = {
        has: filters.category,
      };
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.priceRange && filters.priceRange.length === 2) {
      const [min, max] = filters.priceRange;
      where.OR = [
        {
          AND: [
            { budgetMin: { gte: min } },
            { budgetMax: { lte: max } }
          ]
        },
        {
          AND: [
            { budgetMin: { gte: min } },
            { budgetMax: null }
          ]
        },
        {
          AND: [
            { budgetMin: null },
            { budgetMax: { lte: max } }
          ]
        }
      ];
    }

    return await prisma.event.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            Proposal: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getEventById(id: string) {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        Proposal: {
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
        },
        _count: {
          select: {
            Proposal: true,
          },
        },
      },
    });
  }

  // Package-related methods
  static async getPackages(filters: Partial<MarketplaceFilters> = {}) {
    const where: any = {
      isPublished: true,
      isActive: true,
    };

    if (filters.category) {
      where.category = {
        equals: filters.category,
        mode: 'insensitive',
      };
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.priceRange && filters.priceRange.length === 2) {
      const [min, max] = filters.priceRange;
      where.price = {
        gte: min,
        lte: max,
      };
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        TalentProfile: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by rating if specified
    if (filters.rating !== undefined && filters.rating > 0) {
      return packages.filter(pkg => {
        const rating = pkg.TalentProfile.averageRating;
        return rating !== null && Number(rating) >= filters.rating!;
      });
    }

    return packages;
  }

  // Proposal-related methods
  static async createProposal(data: {
    eventId: string;
    talentId: string;
    quoteAmountKes: number;
    message: string;
  }) {
    return await prisma.proposal.create({
      data,
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
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async getProposalsByEvent(eventId: string) {
    return await prisma.proposal.findMany({
      where: { eventId },
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
  }

  static async acceptProposal(proposalId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get the proposal with event details
      const proposal = await tx.proposal.findUnique({
        where: { id: proposalId },
        include: {
          Event: {
            select: {
              id: true,
              title: true,
              organizerId: true,
              eventDate: true,
            },
          },
        },
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // Accept the proposal
      const acceptedProposal = await tx.proposal.update({
        where: { id: proposalId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Reject all other proposals for this event
      await tx.proposal.updateMany({
        where: {
          eventId: proposal.Event.id,
          id: { not: proposalId },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
        },
      });

      // Calculate platform fee (10%)
      const amount = Number(proposal.quoteAmountKes);
      const platformFeeRate = 0.10;
      const platformFee = amount * platformFeeRate;
      const talentAmount = amount - platformFee;

      // Create booking
      const booking = await tx.booking.create({
        data: {
          eventId: proposal.Event.id,
          organizerId: proposal.Event.organizerId,
          talentId: proposal.talentId,
          amount: amount,
          platformFee: platformFee,
          talentAmount: talentAmount,
          status: 'PENDING',
          proposedDate: proposal.Event.eventDate,
          notes: `Booking created from accepted proposal: ${proposal.message.substring(0, 100)}...`,
        },
      });

      return { acceptedProposal, booking };
    });
  }

  // Utility methods
  static formatBudget(budgetMin?: number, budgetMax?: number): string {
    if (budgetMin && budgetMax) {
      return `KES ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}`;
    } else if (budgetMin) {
      return `KES ${budgetMin.toLocaleString()}+`;
    } else if (budgetMax) {
      return `Up to KES ${budgetMax.toLocaleString()}`;
    }
    return 'Budget not specified';
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
