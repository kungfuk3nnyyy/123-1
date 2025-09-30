
export interface Event {
  id: string;
  title: string;
  description: string;
  category: string[];
  location: string;
  eventDate: string;
  budgetMin?: number;
  budgetMax?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requirements?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    Proposal: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  eventId: string;
  talentId: string;
  quoteAmountKes: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  createdAt: string;
  updatedAt: string;
  Event?: Event;
  Talent?: {
    id: string;
    name: string;
    image?: string;
    TalentProfile?: {
      bio?: string;
      averageRating?: number;
      totalReviews: number;
      totalBookings: number;
    };
  };
}

export interface TalentPackage {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  price: number;
  duration?: string;
  features: string[];
  coverImageUrl?: string;
  images: string[];
  isPublished: boolean;
  isActive: boolean;
  priceIsHidden: boolean;
  viewCount: number;
  inquiryCount: number;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
  talentProfile: {
    user: {
      id: string;
      name: string;
      image?: string;
    };
    averageRating?: number;
    totalReviews: number;
    totalBookings: number;
  };
}

export interface MarketplaceFilters {
  category: string;
  location: string;
  priceRange: number[];
  rating: number;
}

export interface EventFormData {
  title: string;
  description: string;
  category: string[];
  location: string;
  eventDate: string;
  budgetMin: string;
  budgetMax: string;
  requirements: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface ProposalFormData {
  quoteAmountKes: string;
  message: string;
}

export const CATEGORIES = [
  'Music & Entertainment',
  'Photography & Videography',
  'Event Planning',
  'Catering & Food',
  'Decoration & Design',
  'Security & Safety',
  'Transportation',
  'Technical & AV',
  'Marketing & Promotion',
  'Other'
] as const;

export const LOCATIONS = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Kakamega'
] as const;

export type Category = typeof CATEGORIES[number];
export type Location = typeof LOCATIONS[number];
