
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Star
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'
import { BookingStatus, ReviewerType } from '@prisma/client'
import Link from 'next/link'
import RaiseDisputeButton from '@/components/disputes/raise-dispute-button'
import TalentReviewModal from '@/components/talent-review-modal'

interface Booking {
  id: string
  status: BookingStatus
  amount: number
  platformFee: number
  talentAmount: number
  // New calculated fields from API
  gross_amount: number
  platform_fee: number
  net_payout_amount: number
  proposedDate: Date | null
  acceptedDate: Date | null
  completedDate: Date | null
  notes: string | null
  event: {
    id: string
    title: string
    description: string
    location: string
    eventDate: string
    duration: number | null
  }
  organizer: {
    id: string
    name: string
    email: string
    organizerProfile?: {
      companyName: string | null
      phoneNumber: string | null
    }
  }
  disputes?: Array<{
    id: string
    status: string
  }>
  reviews?: Array<{
    id: string
    giverId: string
    reviewerType: string
  }>
  createdAt: Date
}

interface TalentProfile {
  bio: string | null
  category: string | null
  skills: string[]
  location: string | null
  hourlyRate: number | null
}

interface BookingsResponse {
  bookings: Booking[]
  talentProfile: TalentProfile | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TalentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [talentProfile, setTalentProfile] = useState<TalentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/talent/bookings')
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      const data: { success: boolean; data: BookingsResponse } = await response.json()
      if (data.success) {
        setBookings(data.data.bookings)
        setTalentProfile(data.data.talentProfile)
      } else {
        throw new Error('Failed to fetch bookings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDisputeRaised = () => {
    // Refresh bookings when a dispute is raised
    fetchBookings()
  }

  const handleReviewSubmitted = () => {
    // Refresh bookings when a review is submitted
    fetchBookings()
    setReviewModalOpen(false)
    setSelectedBookingForReview(null)
  }

  const handleBookingAction = async (bookingId: string, status: BookingStatus, notes?: string) => {
    try {
      setUpdatingBooking(bookingId)
      const response = await fetch(`/api/talent/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      const data = await response.json()
      if (data.success) {
        // Update the booking in state
        setBookings(prev => prev.map((booking: Booking) => 
          booking.id === bookingId ? { ...booking, status, notes: notes || null } : booking
        ))
      } else {
        throw new Error(data.error || 'Failed to update booking')
      }
    } catch (err) {
      console.error('Booking update error:', err)
      alert(err instanceof Error ? err.message : 'Failed to update booking')
    } finally {
      setUpdatingBooking(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: BookingStatus) => {
    const statusConfig: Record<BookingStatus, { variant: 'secondary' | 'default' | 'destructive' | 'outline', label: string }> = {
      [BookingStatus.PENDING]: { variant: 'secondary', label: 'Pending' },
      [BookingStatus.ACCEPTED]: { variant: 'default', label: 'Accepted' },
      [BookingStatus.DECLINED]: { variant: 'destructive', label: 'Declined' },
      [BookingStatus.IN_PROGRESS]: { variant: 'default', label: 'In Progress' },
      [BookingStatus.COMPLETED]: { variant: 'default', label: 'Completed' },
      [BookingStatus.CANCELLED]: { variant: 'destructive', label: 'Cancelled' },
      [BookingStatus.DISPUTED]: { variant: 'destructive', label: 'Disputed' }
    }

    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings
    if (status === 'pending') return bookings.filter((b: Booking) => b.status === BookingStatus.PENDING)
    if (status === 'active') return bookings.filter((b: Booking) => 
      (b.status === BookingStatus.ACCEPTED || b.status === BookingStatus.IN_PROGRESS)
    )
    if (status === 'completed') return bookings.filter((b: Booking) => b.status === BookingStatus.COMPLETED)
    return bookings
  }

  // Check if profile is complete
  const isProfileComplete = (profile: TalentProfile | null): boolean => {
    if (!profile) return false
    
    return !!(
      profile.bio && 
      profile.category && 
      profile.skills && 
      profile.skills.length > 0 && 
      profile.location && 
      profile.hourlyRate
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_: undefined, i: number) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading bookings: {error}</span>
            </div>
            <Button onClick={fetchBookings} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredBookings = filterBookings(activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/talent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">
          Manage your event bookings and requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {bookings.filter((b: Booking) => b.status === BookingStatus.PENDING).length}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {bookings.filter((b: Booking) => (b.status === BookingStatus.ACCEPTED || b.status === BookingStatus.IN_PROGRESS)).length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {bookings.filter((b: Booking) => b.status === BookingStatus.COMPLETED).length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Requests</CardTitle>
          <CardDescription>View and manage your event bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredBookings.length === 0 ? (
                <EmptyState
                  icon={EMPTY_STATES.TALENT_BOOKINGS.icon}
                  title={EMPTY_STATES.TALENT_BOOKINGS.title}
                  description={EMPTY_STATES.TALENT_BOOKINGS.description}
                  size="md"
                  action={!isProfileComplete(talentProfile) ? {
                    label: 'Complete Your Profile',
                    onClick: () => window.location.href = '/talent/profile'
                  } : undefined}
                />
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{booking.event.title}</h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            
                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{booking.organizer.organizerProfile?.companyName || booking.organizer.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(booking.event.eventDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  {/* Show net amount for confirmed bookings, gross for pending */}
                                  {(booking.status === BookingStatus.ACCEPTED || 
                                    booking.status === BookingStatus.IN_PROGRESS || 
                                    booking.status === BookingStatus.COMPLETED) ? (
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-green-600">
                                        {formatCurrency(booking.net_payout_amount || booking.talentAmount)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        (Total Booking: {formatCurrency(booking.gross_amount || booking.amount)})
                                      </span>
                                    </div>
                                  ) : (
                                    <span>{formatCurrency(booking.amount)}</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {booking.event.duration && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{booking.event.duration} hours</span>
                              </div>
                            )}

                            <p className="text-sm">{booking.event.description}</p>

                            {booking.notes && (
                              <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm"><strong>Notes:</strong> {booking.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/talent/bookings/${booking.id}`}>
                                View Details
                              </Link>
                            </Button>
                            
                            <RaiseDisputeButton 
                              booking={booking as any} 
                              onDisputeRaised={handleDisputeRaised}
                            />

                            {/* Leave a Review button for completed bookings */}
                            {booking.status === BookingStatus.COMPLETED && (
                              (() => {
                                // Check if talent already submitted a review (talent is the one viewing this page)
                                const talentReviewExists = booking.reviews?.some((review: any) => 
                                  review.reviewerType === ReviewerType.TALENT
                                )
                                
                                if (!talentReviewExists) {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedBookingForReview(booking)
                                        setReviewModalOpen(true)
                                      }}
                                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Star className="h-4 w-4 mr-1" />
                                      Leave a Review
                                    </Button>
                                  )
                                }
                                return null
                              })()
                            )}
                            
                            {booking.status === BookingStatus.PENDING && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleBookingAction(booking.id, BookingStatus.ACCEPTED)}
                                  disabled={updatingBooking === booking.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleBookingAction(booking.id, BookingStatus.DECLINED)}
                                  disabled={updatingBooking === booking.id}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Talent Review Modal */}
      {selectedBookingForReview && (
        <TalentReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false)
            setSelectedBookingForReview(null)
          }}
          booking={selectedBookingForReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  )
}
