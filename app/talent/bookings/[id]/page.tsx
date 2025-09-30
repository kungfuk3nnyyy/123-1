
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft,
  User, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle,
  X,
  MessageSquare,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookingStatus } from '@prisma/client'
import BookingProgressTracker from '@/components/booking-progress-tracker'
import Link from 'next/link'

interface OrganizerProfile {
  companyName: string | null
  bio: string | null
  website: string | null
  phoneNumber: string | null
  location: string | null
}

interface BookingDetail {
  id: string
  status: BookingStatus
  amount: number
  createdAt: string
  acceptedDate: string | null
  completedDate: string | null
  notes: string | null
  event: {
    id: string
    title: string
    description: string
    category: string
    location: string
    eventDate: string
    requirements: string | null
  }
  organizer: {
    id: string
    name: string | null
    email: string
    organizerProfile: OrganizerProfile | null
  }
  transactions: Array<{
    id: string
    status: string
    amount: number
    createdAt: string
    paystackRef: string | null
  }>
}

export default function TalentBookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.id as string
  
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail()
    }
  }, [bookingId])

  const fetchBookingDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch booking details')
      }
      
      const result = await response.json()
      if (result.success) {
        setBooking(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch booking details')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingAction = async (bookingId: string, status: BookingStatus, notes?: string) => {
    console.log('Attempting to accept booking with ID:', bookingId);
    console.log('Status:', status);
    
    try {
      setActionLoading(status === BookingStatus.ACCEPTED ? 'accept' : 'decline')
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
        setBooking(prev => prev ? { ...prev, status, notes: notes || null } : null)
        fetchBookingDetail() // Refresh the data
      } else {
        throw new Error(data.error || 'Failed to update booking')
      }
    } catch (err) {
      console.error('Booking update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update booking')
    } finally {
      setActionLoading(null)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'bg-yellow-100 text-yellow-800'
      case BookingStatus.ACCEPTED: return 'bg-calm-soft-blue/20 text-blue-800'
      case BookingStatus.IN_PROGRESS: return 'bg-purple-100 text-purple-800'
      case BookingStatus.COMPLETED: return 'bg-green-100 text-green-800'
      case BookingStatus.CANCELLED: return 'bg-red-100 text-red-800'
      case BookingStatus.DECLINED: return 'bg-calm-light-grey text-calm-dark-grey'
      default: return 'bg-calm-light-grey text-calm-dark-grey'
    }
  }

  const getActionButtons = () => {
    if (!booking) return null

    const buttons = []
    
    switch (booking.status) {
      case BookingStatus.PENDING:
        buttons.push(
          <Button
            key="accept"
            onClick={() => handleBookingAction(booking.id, BookingStatus.ACCEPTED)}
            disabled={actionLoading === 'accept'}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept Booking
          </Button>,
          <Button
            key="decline"
            variant="outline"
            onClick={() => handleBookingAction(booking.id, BookingStatus.DECLINED)}
            disabled={actionLoading === 'decline'}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Decline
          </Button>
        )
        break
    }

    return buttons
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {error || 'Booking not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{booking.event.title}</h1>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Booking details and progress tracking
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingProgressTracker 
            status={booking.status} 
            eventDate={booking.event.eventDate} 
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{booking.event.title}</h3>
              <p className="text-muted-foreground line-clamp-3">{booking.event.description}</p>
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(booking.event.eventDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{booking.event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatCurrency(booking.amount)}</span>
              </div>
            </div>

            <div>
              <Badge variant="outline">{booking.event.category}</Badge>
            </div>

            {booking.event.requirements && (
              <div>
                <h4 className="font-medium mb-2">Requirements</h4>
                <p className="text-sm text-muted-foreground">{booking.event.requirements}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organizer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Organizer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={booking.organizer.name || ''} />
                <AvatarFallback className="text-lg">
                  {booking.organizer.name?.charAt(0)?.toUpperCase() || 'O'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {booking.organizer.organizerProfile?.companyName || booking.organizer.name || 'Anonymous Organizer'}
                </h3>
                {booking.organizer.name && booking.organizer.organizerProfile?.companyName && (
                  <p className="text-sm text-muted-foreground">Contact: {booking.organizer.name}</p>
                )}
              </div>
            </div>

            {booking.organizer.organizerProfile?.bio && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {booking.organizer.organizerProfile.bio}
              </p>
            )}

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{booking.organizer.email}</span>
              </div>
              {booking.organizer.organizerProfile?.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.organizer.organizerProfile.phoneNumber}</span>
                </div>
              )}
              {booking.organizer.organizerProfile?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.organizer.organizerProfile.location}</span>
                </div>
              )}
              {booking.organizer.organizerProfile?.website && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Website:</span>
                  <a 
                    href={booking.organizer.organizerProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-calm-soft-blue hover:underline"
                  >
                    {booking.organizer.organizerProfile.website}
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/talent/messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID:</span>
                <span className="font-mono">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applied:</span>
                <span>{formatDate(booking.createdAt)}</span>
              </div>
              {booking.acceptedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted:</span>
                  <span>{formatDate(booking.acceptedDate)}</span>
                </div>
              )}
              {booking.completedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{formatDate(booking.completedDate)}</span>
                </div>
              )}
            </div>

            {booking.notes && (
              <div>
                <h4 className="font-medium mb-2">Application Notes</h4>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Earning Amount:</span>
                <span>{formatCurrency(booking.amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        {booking.transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Payment {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <Badge 
                      variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
              {booking.status === BookingStatus.COMPLETED && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    Payment has been received. Your payout will be processed within 24-48 hours.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      {getActionButtons() && getActionButtons()!.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              {getActionButtons()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
