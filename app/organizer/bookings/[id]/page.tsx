

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  CreditCard,
  CheckCircle,
  X,
  MessageSquare,
  Star,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookingStatus } from '@prisma/client'
import BookingProgressTracker from '@/components/booking-progress-tracker'
import Link from 'next/link'

interface TalentProfile {
  category: string | null
  averageRating: number | null
  totalReviews: number
  bio: string | null
  location: string | null
  hourlyRate: number | null
  phoneNumber: string | null
}

interface BookingDetail {
  id: string
  organizerId: string
  status: BookingStatus
  amount: number
  createdAt: string
  acceptedDate: string | null
  completedDate: string | null
  notes: string | null
  eventEndDateTime: string | null
  event: {
    id: string
    title: string
    description: string
    category: string
    location: string
    eventDate: string
    duration: number | null
    requirements: string | null
  }
  talent: {
    id: string
    name: string | null
    email: string
    talentProfile: TalentProfile | null
  }
  transactions: Array<{
    id: string
    status: string
    amount: number
    createdAt: string
    paystackRef: string | null
  }>
}

export default function OrganizerBookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params?.id as string
  const { data: session } = useSession()
  
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle')

  // Check URL parameters for payment status
  const paymentStatus = searchParams?.get('payment_status')
  const verificationSource = searchParams?.get('verification_source')
  const reference = searchParams?.get('reference')

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail()
    }
  }, [bookingId])

  useEffect(() => {
    // Handle automatic verification status from URL parameters
    if (paymentStatus === 'verified' && verificationSource === 'automatic') {
      setVerificationStatus('verified')
      // Show success message briefly, then clear URL params
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('payment_status')
        url.searchParams.delete('verification_source')
        url.searchParams.delete('step')
        url.searchParams.delete('amount')
        window.history.replaceState({}, '', url.toString())
      }, 3000)
    } else if (paymentStatus === 'pending' && verificationSource === 'failed_automatic') {
      // Automatic verification failed, try manual verification
      setVerificationStatus('verifying')
      handleManualVerification()
    }
  }, [paymentStatus, verificationSource, bookingId])

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

  const handleManualVerification = async () => {
    if (!bookingId) return

    try {
      setVerificationStatus('verifying')
      setActionLoading('verify-payment')
      
      const response = await fetch(`/api/organizer/bookings/${bookingId}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (result.success && result.status === 'completed') {
        setVerificationStatus('verified')
        // Refresh booking details to show updated status
        await fetchBookingDetail()
        
        // Clear URL parameters after successful verification
        const url = new URL(window.location.href)
        url.searchParams.delete('payment_status')
        url.searchParams.delete('verification_source')
        url.searchParams.delete('reference')
        url.searchParams.delete('step')
        window.history.replaceState({}, '', url.toString())
      } else {
        setVerificationStatus('failed')
      }
    } catch (error) {
      console.error('Manual verification failed:', error)
      setVerificationStatus('failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelBooking = async () => {
    if (!booking) return

    try {
      setActionLoading('cancel')
      const response = await fetch(`/api/organizer/bookings/${bookingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/organizer/bookings?cancelled=true')
      } else {
        throw new Error('Failed to cancel booking')
      }
    } catch (error) {
      console.error('Cancel booking error:', error)
      setError('Failed to cancel booking')
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
      case BookingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case BookingStatus.ACCEPTED:
        return 'bg-blue-100 text-blue-800'
      case BookingStatus.IN_PROGRESS:
        return 'bg-green-100 text-green-800'
      case BookingStatus.COMPLETED:
        return 'bg-green-100 text-green-800'
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-calm-soft-blue" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {error || 'Booking not found'}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={() => router.push('/organizer/bookings')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const hasCompletedTransaction = booking.transactions.some(t => t.status === 'COMPLETED')
  const latestTransaction = booking.transactions[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/organizer/bookings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-muted-foreground">Booking ID: {booking.id}</p>
            </div>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Payment Status Alerts */}
        {verificationStatus === 'verified' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Payment has been successfully verified! Your booking is now confirmed and the talent has been notified.
            </AlertDescription>
          </Alert>
        )}

        {verificationStatus === 'verifying' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-600">
              Verifying your payment... Please wait while we confirm your transaction.
            </AlertDescription>
          </Alert>
        )}

        {verificationStatus === 'failed' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              Payment verification failed. Please try again or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Tracker */}
        <BookingProgressTracker 
          status={booking.status}
          createdAt={booking.createdAt}
          acceptedDate={booking.acceptedDate}
          completedDate={booking.completedDate}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Event Information */}
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
                {booking.event.duration && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{booking.event.duration} hours</span>
                  </div>
                )}
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

          {/* Talent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Talent Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {booking.talent.name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {booking.talent.name || 'Talent'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{booking.talent.email}</p>
                  {booking.talent.talentProfile?.averageRating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {booking.talent.talentProfile.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({booking.talent.talentProfile.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {booking.talent.talentProfile?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {booking.talent.talentProfile.bio}
                </p>
              )}

              <div className="grid gap-2 text-sm">
                {booking.talent.talentProfile?.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="secondary">{booking.talent.talentProfile.category}</Badge>
                  </div>
                )}
                {booking.talent.talentProfile?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.talent.talentProfile.location}</span>
                  </div>
                )}
                {booking.talent.talentProfile?.hourlyRate && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCurrency(booking.talent.talentProfile.hourlyRate)}/hour</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Message
                </Button>
                {booking.talent.talentProfile?.phoneNumber && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span>{formatCurrency(booking.amount)}</span>
              </div>

              {booking.transactions.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Transaction History</h4>
                  {booking.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </p>
                        {transaction.paystackRef && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Ref: {transaction.paystackRef}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className={transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No payment transactions found</p>
                </div>
              )}

              {/* Payment Action Buttons */}
              {!hasCompletedTransaction && booking.status === BookingStatus.ACCEPTED && (
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full" 
                    onClick={() => router.push(`/api/organizer/bookings/${bookingId}/payment`)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                </div>
              )}

              {/* Manual Verification Button - Show when payment is pending or verification failed */}
              {latestTransaction && latestTransaction.status !== 'COMPLETED' && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleManualVerification}
                    disabled={actionLoading === 'verify-payment' || verificationStatus === 'verifying'}
                  >
                    {actionLoading === 'verify-payment' || verificationStatus === 'verifying' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying Payment...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Payment Status
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
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
                {booking.eventEndDateTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event End:</span>
                    <span>{formatDate(booking.eventEndDateTime)}</span>
                  </div>
                )}
              </div>

              {booking.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {booking.status === BookingStatus.PENDING && (
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={actionLoading === 'cancel'}
              className="flex-1 sm:flex-none"
            >
              {actionLoading === 'cancel' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Booking
                </>
              )}
            </Button>
          )}
          
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href={`/organizer/bookings/${booking.id}/messages`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              View Messages
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

