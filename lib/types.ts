
import { UserRole, BookingStatus, TransactionType, TransactionStatus, PayoutStatus, NotificationType, DisputeStatus, DisputeReason, ReviewerType, VerificationStatus } from '@prisma/client'

// User Types
export interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  isActive: boolean
  verificationStatus: VerificationStatus
  createdAt: Date
  updatedAt: Date
  talentProfile?: TalentProfile
  organizerProfile?: OrganizerProfile
}

export interface TalentProfile {
  id: string
  userId: string
  bio: string | null
  tagline: string | null
  location: string | null
  website: string | null
  phoneNumber: string | null
  category: string | null
  skills: string[]
  experience: string | null
  hourlyRate: number | null
  availability: string | null
  averageRating: number | null
  totalReviews: number
  totalBookings: number
  bankAccount?: BankAccount
  portfolioItems?: File[]
  createdAt: Date
  updatedAt: Date
}

export interface OrganizerProfile {
  id: string
  userId: string
  companyName: string | null
  bio: string | null
  website: string | null
  phoneNumber: string | null
  location: string | null
  eventTypes: string[]
  totalEvents: number
  averageRating: number | null
  createdAt: Date
  updatedAt: Date
}

// Event Types
export interface Event {
  id: string
  organizerId: string
  title: string
  description: string
  category: string
  location: string
  eventDate: Date
  duration: number | null
  requirements: string | null
  budget: number | null
  isPublic: boolean
  isActive: boolean
  organizer: User
  bookings?: Booking[]
  createdAt: Date
  updatedAt: Date
}

// Booking Types
export interface Booking {
  id: string
  eventId: string
  organizerId: string
  talentId: string
  status: BookingStatus
  amount: number
  platformFee: number
  talentAmount: number
  proposedDate: Date | null
  acceptedDate: Date | null
  completedDate: Date | null
  notes: string | null
  event: Event
  organizer: User
  talent: User
  messages?: Message[]
  transactions?: Transaction[]
  reviews?: Review[]
  disputes?: Dispute[]
  createdAt: Date
  updatedAt: Date
}

// Message Types
export interface Message {
  id: string
  bookingId: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  booking: Booking
  sender: User
  receiver: User
  attachments?: File[]
  createdAt: Date
  updatedAt: Date
}

// Transaction Types
export interface Transaction {
  id: string
  bookingId: string
  userId: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  currency: string
  paystackRef: string | null
  paystackData: any
  description: string | null
  booking: Booking
  user: User
  createdAt: Date
  updatedAt: Date
}

// Review Types
export interface Review {
  id: string
  bookingId: string
  giverId: string
  receiverId: string
  rating: number
  comment: string
  reviewerType: ReviewerType
  isVisible: boolean
  booking: Booking
  giver: User
  receiver: User
  createdAt: Date
  updatedAt: Date
}

// Package Types
export interface Package {
  id: string
  talentId: string
  title: string
  description: string
  category: string
  location: string | null
  price: number
  priceIsHidden: boolean
  duration: string | null
  features: string[]
  coverImageUrl: string | null
  images: string[]
  isPublished: boolean
  isActive: boolean
  viewCount: number
  inquiryCount: number
  bookingCount: number
  talent?: TalentProfile
  createdAt: Date
  updatedAt: Date
}

// File Types
export interface File {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  talentId: string | null
  messageId: string | null
  createdAt: Date
  updatedAt: Date
}

// Bank Account Types
export interface BankAccount {
  id: string
  talentId: string
  accountName: string
  accountNumber: string
  bankCode: string
  bankName: string
  recipientCode: string | null
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

// Payout Types
export interface Payout {
  id: string
  talentId: string
  amount: number
  status: PayoutStatus
  transferCode: string | null
  transferData: any
  processedAt: Date | null
  failureReason: string | null
  talent: User
  createdAt: Date
  updatedAt: Date
}

// Dispute Types
export interface Dispute {
  id: string
  bookingId: string
  disputedById: string
  reason: DisputeReason
  explanation: string
  status: DisputeStatus
  resolvedById: string | null
  resolutionNotes: string | null
  refundAmount: number | null
  payoutAmount: number | null
  resolvedAt: Date | null
  booking: Booking
  disputedBy: User
  createdAt: Date
  updatedAt: Date
}

// KYC Types
export interface KycSubmission {
  id: string
  userId: string
  documentType: string
  documentNumber: string | null
  documentFileName: string
  documentFilePath: string
  status: VerificationStatus
  submittedAt: Date
  reviewedById: string | null
  reviewedAt: Date | null
  rejectionReason: string | null
  user: User
  createdAt: Date
  updatedAt: Date
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  bookingId: string | null
  messageId: string | null
  eventId: string | null
  actionUrl: string | null
  emailSent: boolean
  emailSentAt: Date | null
  user: User
  booking?: Booking
  relatedMessage?: Message
  event?: Event
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreference {
  id: string
  userId: string
  emailMessages: boolean
  emailBookings: boolean
  emailPayments: boolean
  emailReviews: boolean
  emailReminders: boolean
  emailPayouts: boolean
  emailAdminUpdates: boolean
  user: User
  createdAt: Date
  updatedAt: Date
}

// Dashboard Statistics Types
export interface AdminStats {
  totalUsers: number
  totalBookings: number
  totalRevenue: number
  platformFees: number
  pendingPayouts: number
  activeEvents: number
  activeDisputes: number
  monthlyGrowth: {
    users: number
    bookings: number
    revenue: number
  }
}

// Analytics Types
export interface TimelineData {
  date: string
  formattedDate: string
  total?: number
  talents?: number
  organizers?: number
  completed?: number
  created?: number
  revenue?: number
  fees?: number
}

export interface RegistrationAnalytics {
  timeline: TimelineData[]
  summary: {
    totalRegistrations: number
    totalTalents: number
    totalOrganizers: number
    period: string
  }
}

export interface BookingAnalytics {
  timeline: TimelineData[]
  summary: {
    totalCompleted: number
    totalCreated: number
    totalRevenue: number
    totalFees: number
    completionRate: number
    period: string
  }
}

export interface TopPackageAnalytics {
  topPackages: TopPackage[]
  summary: {
    totalAnalyzedBookings: number
    totalTalentsWithBookings: number
    period: string
    averageBookingsPerTalent: number
  }
}

export interface TopPackage {
  talentId: string
  talentName: string
  category: string
  bookingCount: number
  totalRevenue: number
  averageBookingValue: number
  packages: PackageInfo[]
  trend: {
    percentage: number
    direction: 'up' | 'down'
    previousPeriodCount: number
  }
}

export interface PackageInfo {
  id: string
  title: string
  category: string
  price: number
  coverImageUrl: string | null
  isPublished: boolean
}

export interface KycAnalytics {
  statusSummary: {
    pending: number
    verified: number
    rejected: number
    unverified: number
  }
  recentSubmissions: KycSubmissionInfo[]
  overdueSubmissions: KycSubmissionInfo[]
  metrics: {
    totalSubmissions: number
    pendingCount: number
    overdueCount: number
    averageProcessingDays: number
    recentSubmissionCount: number
  }
}

export interface KycSubmissionInfo {
  id: string
  userId?: string
  userName: string
  userEmail: string
  userRole: string
  documentType: string
  status: string
  submittedAt: string
  reviewedAt?: string
  isOverdue?: boolean
  daysOverdue?: number
}

export interface DisputeAnalytics {
  statusSummary: {
    open: number
    underReview: number
    resolved: number
  }
  reasonSummary: Record<string, number>
  recentDisputes: DisputeInfo[]
  urgentDisputes: DisputeInfo[]
  metrics: {
    totalDisputes: number
    activeDisputes: number
    urgentCount: number
    averageResolutionDays: number
    recentDisputeCount: number
    resolutionRate: number
  }
}

export interface DisputeInfo {
  id: string
  bookingId?: string
  eventTitle: string
  disputedBy: {
    id?: string
    name: string
    email: string
    role: string
  }
  reason: string
  status: string
  amount: number
  createdAt: string
  isUrgent?: boolean
  daysOpen?: number
}

export interface TalentStats {
  upcomingBookings: number
  totalEarnings: number
  pendingPayouts: number
  averageRating: number
  totalReviews: number
  profileCompletion: number
  unreadMessages: number
  unreadNotifications: number
  monthlyEarnings: number
}

export interface OrganizerStats {
  activeEvents: number
  totalBookings: number
  totalSpent: number
  pendingBookings: number
  unreadMessages: number
  unreadNotifications: number
  eventsThisMonth: number
  completedEvents: number
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Search and Filter Types
export interface TalentSearchFilters {
  category?: string
  location?: string
  minRating?: number
  maxRate?: number
  skills?: string[]
  availability?: string
}

export interface EventSearchFilters {
  category?: string
  location?: string
  minBudget?: number
  maxBudget?: number
  dateFrom?: Date
  dateTo?: Date
}

// Form Types
export interface CreateEventForm {
  title: string
  description: string
  category: string
  location: string
  eventDate: Date
  duration?: number
  requirements?: string
  budget?: number
  isPublic: boolean
}

export interface UpdateProfileForm {
  name?: string
  bio?: string
  tagline?: string
  location?: string
  website?: string
  phoneNumber?: string
  category?: string
  skills?: string[]
  experience?: string
  hourlyRate?: number
  availability?: string
}

export interface BankAccountForm {
  accountName: string
  accountNumber: string
  bankCode: string
  bankName: string
}

export interface BookingOfferForm {
  eventId: string
  talentId: string
  amount: number
  proposedDate?: Date
  notes?: string
}

export interface DisputeSubmissionForm {
  reason: DisputeReason
  explanation: string
}

export interface DisputeResolutionForm {
  resolutionNotes: string
  refundAmount?: number
  payoutAmount?: number
}

export interface CreatePackageForm {
  title: string
  description: string
  category: string
  location?: string
  price: number
  priceIsHidden?: boolean
  duration?: string
  features: string[]
  coverImageUrl?: string
  images?: string[]
}

export interface UpdatePackageForm {
  title?: string
  description?: string
  category?: string
  location?: string
  price?: number
  priceIsHidden?: boolean
  duration?: string
  features?: string[]
  coverImageUrl?: string
  images?: string[]
  isPublished?: boolean
}

export interface ReviewSubmissionForm {
  rating: number
  comment: string
  reviewerType: ReviewerType
}

export interface BookingCompletionForm {
  review: ReviewSubmissionForm
}

export interface KycSubmissionForm {
  documentType: string
  documentNumber?: string
  documentFile: File
}

export interface KycReviewForm {
  status: VerificationStatus
  rejectionReason?: string
}

// Enum exports for easy access
export { UserRole, BookingStatus, TransactionType, TransactionStatus, PayoutStatus, NotificationType, DisputeStatus, DisputeReason, ReviewerType, VerificationStatus }

// Constants
export const PLATFORM_FEE_PERCENTAGE = 0.10 // 10%
export const DISPUTE_RESOLUTION_FEE_PERCENTAGE = 0.05 // 5% commission on dispute resolutions
export const CURRENCY = 'KES'

export const BOOKING_STATUS_LABELS = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.ACCEPTED]: 'Accepted',
  [BookingStatus.DECLINED]: 'Declined',
  [BookingStatus.IN_PROGRESS]: 'In Progress',
  [BookingStatus.COMPLETED]: 'Completed',
  [BookingStatus.CANCELLED]: 'Cancelled',
  [BookingStatus.DISPUTED]: 'Disputed'
}

export const USER_ROLE_LABELS = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.TALENT]: 'Talent',
  [UserRole.ORGANIZER]: 'Organizer'
}

export const DISPUTE_STATUS_LABELS = {
  [DisputeStatus.OPEN]: 'Open',
  [DisputeStatus.UNDER_REVIEW]: 'Under Review',
  [DisputeStatus.RESOLVED_ORGANIZER_FAVOR]: 'Resolved (Organizer Favor)',
  [DisputeStatus.RESOLVED_TALENT_FAVOR]: 'Resolved (Talent Favor)',
  [DisputeStatus.RESOLVED_PARTIAL]: 'Resolved (Partial)'
}

export const DISPUTE_REASON_LABELS = {
  [DisputeReason.TALENT_NO_SHOW]: 'Talent was a no-show',
  [DisputeReason.SERVICE_NOT_AS_DESCRIBED]: 'Service not as described',
  [DisputeReason.UNPROFESSIONAL_CONDUCT]: 'Unprofessional conduct',
  [DisputeReason.ORGANIZER_UNRESPONSIVE]: 'Organizer unresponsive post-event',
  [DisputeReason.SCOPE_DISAGREEMENT]: 'Disagreement over final scope',
  [DisputeReason.UNSAFE_ENVIRONMENT]: 'Unsafe environment',
  [DisputeReason.OTHER]: 'Other'
}

// Role-specific dispute reasons
export const ORGANIZER_DISPUTE_REASONS = [
  DisputeReason.TALENT_NO_SHOW,
  DisputeReason.SERVICE_NOT_AS_DESCRIBED,
  DisputeReason.UNPROFESSIONAL_CONDUCT,
  DisputeReason.OTHER
]

export const TALENT_DISPUTE_REASONS = [
  DisputeReason.ORGANIZER_UNRESPONSIVE,
  DisputeReason.SCOPE_DISAGREEMENT,
  DisputeReason.UNSAFE_ENVIRONMENT,
  DisputeReason.OTHER
]
