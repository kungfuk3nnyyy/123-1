'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle,
  Calendar, 
  MapPin, 
  DollarSign, 
  User,
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface BookingDetail {
  id: string
  status: string
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
    organizerProfile: {
      companyName: string | null
      location: string | null
      phoneNumber: string | null
    } | null
  }
  talent: {
    id: string
    name: string | null
    email: string
    talentProfile: {
      bio: string | null
      category: string | null
      location: string | null
    } | null
  }
  transactions: Array<{
    id: string
    type: string
    status: string
    amount: number
    createdAt: string
  }>
}

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams?.get('booking_id')
  
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail()
    } else {
      setError('No booking ID provided')
      setLoading(false)
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
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 py-8 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-muted-foreground mt-2">
              Your payment has been processed successfully. Here are your booking details.
            </p>
          </div>
        </div>

        {/* Booking Details */}
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
              <div>
                <h3 className="font-semibold text-lg">
                  {booking.talent.name || 'Talent'}
                </h3>
                <p className="text-sm text-muted-foreground">{booking.talent.email}</p>
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
              </div>
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
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-mono">{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-calm-soft-blue/20 text-blue-800">
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booked:</span>
                  <span>{formatDate(booking.createdAt)}</span>
                </div>
                {booking.acceptedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accepted:</span>
                    <span>{formatDate(booking.acceptedDate)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(booking.amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.transactions.length > 0 ? (
                <div className="space-y-3">
                  {booking.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type.replace('_', ' ')} - {formatDate(transaction.createdAt)}
                        </p>
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
                  <p className="text-sm text-muted-foreground">
                    Payment is being processed. Transaction details will appear here shortly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-calm-soft-blue/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-calm-soft-blue">1</span>
                </div>
                <div>
                  <p className="font-medium">Payment Confirmed</p>
                  <p className="text-muted-foreground">Your payment has been successfully processed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Talent Notification</p>
                  <p className="text-muted-foreground">The talent will be notified and can now prepare for your event.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Event Day</p>
                  <p className="text-muted-foreground">Enjoy your event! You can track progress in your dashboard.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="flex-1 sm:flex-none">
            <Link href="/dashboard">
              View Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href={`/bookings/${booking.id}`}>
              View Booking Details
            </Link>
          </Button>
        </div>

        {/* Support Information */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact our support team or check your{' '}
            <Link href="/dashboard" className="text-calm-soft-blue hover:underline">
              dashboard
            </Link>{' '}
            for updates.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-calm-soft-blue" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
