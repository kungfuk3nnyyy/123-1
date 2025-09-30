
import { 
  Package, 
  Users, 
  Calendar, 
  MessageSquare, 
  Star, 
  DollarSign, 
  Bell, 
  Search, 
  FileText, 
  Camera, 
  Music, 
  Mic, 
  Video, 
  Palette,
  ShoppingCart,
  UserPlus,
  Heart,
  Award,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  MapPin,
  Briefcase,
  Settings,
  CreditCard,
  Gift,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

export const EMPTY_STATES = {
  // Homepage sections
  FEATURED_PACKAGES: {
    icon: Package,
    title: 'No featured packages available',
    description: 'Check back soon for curated service packages from our top-rated professionals.'
  },
  
  TOP_TALENTS: {
    icon: Users,
    title: 'No talents found',
    description: 'Try adjusting your search or filter criteria to find the perfect talent for your event.'
  },
  
  TESTIMONIALS: {
    icon: Star,
    title: 'No testimonials available',
    description: 'Customer testimonials will appear here once we have reviews to showcase.'
  },

  // Explore packages page
  PACKAGES_SEARCH: {
    icon: Search,
    title: 'No packages found',
    description: 'Try adjusting your search criteria or browse different categories to find the perfect package.'
  },
  
  PACKAGES_GENERAL: {
    icon: Package,
    title: 'No packages available',
    description: 'There are currently no service packages available. Check back later for new offerings.'
  },

  // Marketplace
  MARKETPLACE_PACKAGES: {
    icon: ShoppingCart,
    title: 'No packages available',
    description: 'Browse our talented professionals and discover amazing service packages for your events.'
  },
  
  MARKETPLACE_EVENTS: {
    icon: Calendar,
    title: 'No events posted',
    description: 'Be the first to post an event and connect with talented professionals in your area.'
  },
  
  MARKETPLACE_SEARCH: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you\'re looking for.'
  },

  // Talent dashboard
  TALENT_BOOKINGS: {
    icon: Calendar,
    title: 'No pending booking requests',
    description: 'You have no pending booking requests at this time. When a new booking is requested, it will appear here.'
  },
  
  TALENT_MESSAGES: {
    icon: MessageSquare,
    title: 'No messages yet',
    description: 'Your conversations with clients will appear here. Start by completing your profile to get noticed.'
  },
  
  TALENT_PACKAGES: {
    icon: Package,
    title: 'No packages created',
    description: 'Create your first service package to showcase your offerings to potential clients.'
  },
  
  TALENT_REVIEWS: {
    icon: Star,
    title: 'No reviews yet',
    description: 'Complete your first booking to start receiving reviews from satisfied clients.'
  },
  
  TALENT_EARNINGS: {
    icon: DollarSign,
    title: 'No earnings yet',
    description: 'Your earnings from completed bookings will be displayed here.'
  },
  
  TALENT_NOTIFICATIONS: {
    icon: Bell,
    title: 'No notifications',
    description: 'You\'re all caught up! New notifications will appear here.'
  },
  
  TALENT_EVENTS: {
    icon: Calendar,
    title: 'No events available',
    description: 'Browse the marketplace to find events that match your skills and interests.'
  },
  
  TALENT_DISPUTES: {
    icon: AlertCircle,
    title: 'No disputes',
    description: 'Great! You have no active disputes. Any future disputes will be managed here.'
  },
  
  TALENT_REFERRALS: {
    icon: UserPlus,
    title: 'No referrals yet',
    description: 'Invite other talented professionals to join and earn rewards for successful referrals.'
  },

  // Organizer/Client dashboard
  CLIENT_BOOKINGS: {
    icon: Calendar,
    title: 'No bookings yet',
    description: 'Your event bookings will appear here. Start by browsing our talented professionals.'
  },
  
  CLIENT_MESSAGES: {
    icon: MessageSquare,
    title: 'No conversations',
    description: 'Your messages with talent will appear here. Start by booking a service or sending an inquiry.'
  },
  
  CLIENT_EVENTS: {
    icon: Calendar,
    title: 'No events posted',
    description: 'Post your first event to connect with talented professionals who can make it amazing.'
  },

  // Admin dashboard
  ADMIN_USERS: {
    icon: Users,
    title: 'No users found',
    description: 'User accounts will be displayed here as people join the platform.'
  },
  
  ADMIN_BOOKINGS: {
    icon: Calendar,
    title: 'No bookings to review',
    description: 'Booking transactions and disputes will appear here for administrative review.'
  },
  
  ADMIN_DISPUTES: {
    icon: AlertCircle,
    title: 'No active disputes',
    description: 'Dispute cases requiring administrative attention will be shown here.'
  },
  
  ADMIN_ANALYTICS: {
    icon: BarChart3,
    title: 'No analytics data',
    description: 'Platform analytics and insights will be displayed here once data is available.'
  },
  
  ADMIN_TRANSACTIONS: {
    icon: CreditCard,
    title: 'No transactions',
    description: 'Payment transactions and financial data will be displayed here.'
  },
  
  ADMIN_PAYOUTS: {
    icon: DollarSign,
    title: 'No pending payouts',
    description: 'Talent payout requests and processing status will appear here.'
  },
  
  ADMIN_PACKAGES: {
    icon: Package,
    title: 'No packages to moderate',
    description: 'Service packages requiring review or moderation will be listed here.'
  },
  
  ADMIN_KYC: {
    icon: FileText,
    title: 'No KYC submissions',
    description: 'Know Your Customer verification submissions will appear here for review.'
  },

  // Profile pages
  PROFILE_PORTFOLIO: {
    icon: Camera,
    title: 'No portfolio items',
    description: 'Showcase your work by adding photos and videos of your previous events.'
  },
  
  PROFILE_REVIEWS: {
    icon: Star,
    title: 'No reviews yet',
    description: 'Client reviews and ratings will appear here after completed bookings.'
  },
  
  PROFILE_PACKAGES: {
    icon: Package,
    title: 'No service packages',
    description: 'This talent hasn\'t created any service packages yet.'
  },

  // Search and filter results
  SEARCH_NO_RESULTS: {
    icon: Search,
    title: 'No results found',
    description: 'Try different keywords or adjust your filters to find what you\'re looking for.'
  },
  
  FILTER_NO_RESULTS: {
    icon: Filter,
    title: 'No matches found',
    description: 'Try expanding your search criteria or removing some filters.'
  },

  // Category-specific empty states
  CATEGORY_PHOTOGRAPHY: {
    icon: Camera,
    title: 'No photographers available',
    description: 'We\'re working to bring you the best photographers in your area.'
  },
  
  CATEGORY_MUSIC: {
    icon: Music,
    title: 'No musicians available',
    description: 'Check back soon for talented musicians and live bands.'
  },
  
  CATEGORY_DJ: {
    icon: Mic,
    title: 'No DJs available',
    description: 'We\'re expanding our network of professional DJs.'
  },
  
  CATEGORY_VIDEO: {
    icon: Video,
    title: 'No videographers available',
    description: 'Professional videography services will be listed here.'
  },
  
  CATEGORY_ART: {
    icon: Palette,
    title: 'No artists available',
    description: 'Creative artists and designers will appear in this category.'
  },

  // Generic fallbacks
  GENERIC_LIST: {
    icon: FileText,
    title: 'No items available',
    description: 'Items will appear here when they become available.'
  },
  
  GENERIC_SEARCH: {
    icon: Search,
    title: 'No results',
    description: 'Try adjusting your search criteria.'
  },
  
  LOADING_ERROR: {
    icon: AlertCircle,
    title: 'Unable to load data',
    description: 'Please try refreshing the page or check your internet connection.'
  }
} as const

export type EmptyStateKey = keyof typeof EMPTY_STATES
