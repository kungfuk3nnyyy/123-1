
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  DollarSign, 
  CreditCard,
  CheckCircle,
  X,
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'
import RaiseDisputeButton from '@/components/disputes/raise-dispute-button'
import BookingFinalizeModal from '@/components/booking-finalize-modal'

interface Booking {
  id: string
  status: BookingStatus
  amount: number
  talentAmount: number
  createdAt: string
  eventEndDateTime?: string | null
  event: {
    id: string
    title: string
    eventDate: string  // Changed to string only to match usage
    duration?: number | null
  }
  talent: {
    id: string
    name: string
    talentProfile: {
      category: string
    } | null
  }
  transactions: Array<{
    id: string
    status: string
    amount: number
  }>
  disputes?: Array<{
    id: string
    status: string
  }>
  reviews?: Array<{
    id: string
    giverId: string
    reviewerType: string
  }>
}

interface BookingsData {
  bookings: Booking[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function BookingsPage() {
  const [data, setData] = useState<BookingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [currentPage, statusFilter])

  useEffect(() => {
    // Check for payment callback messages
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    
    if (success === 'payment_completed') {
      setError(null)
      // You might want to show a success toast here instead
      setTimeout(() => {
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname)
      }, 100)
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'missing_reference': 'Payment reference is missing',
        'verification_failed': 'Payment verification failed',
        'transaction_not_found': 'Transaction not found',
        'payment_failed': 'Payment was unsuccessful',
        'callback_error': 'An error occurred during payment processing'
      }
      setError(errorMessages[error] || 'Payment processing error')
      setTimeout(() => {
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname)
      }, 100)
    }
  }, [])

  const handleDisputeRaised = () => {
    // Refresh bookings when a dispute is raised
    fetchBookings()
  }

  const handleBookingFinalized = () => {
    // Refresh bookings when a booking is finalized
    fetchBookings()
    setFinalizeModalOpen(false)
    setSelectedBooking(null)
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/organizer/bookings?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch bookings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingAction = async (bookingId: string, action: string) => {
    try {
      setActionLoading(bookingId)
      const response = await fetch(`/api/organizer/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        fetchBookings() // Refresh the list
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to update booking')
      }
    } catch (err) {
      setError('Failed to update booking')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePayment = async (bookingId: string) => {
    try {
      setActionLoading(bookingId)
      const response = await fetch(`/api/organizer/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.authorization_url) {
          // Redirect to Paystack payment page
          window.location.href = result.data.authorization_url
        } else {
          setError('Failed to initialize payment')
        }
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to initialize payment')
      }
    } catch (err) {
      setError('Failed to initialize payment')
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
      month: 'short',
      day: 'numeric'
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
      case BookingStatus.DISPUTED: return 'bg-red-100 text-red-800'
      default: return 'bg-calm-light-grey text-calm-dark-grey'
    }
  }

  const getStatusActions = (booking: Booking) => {
    const actions = []
    
    switch (booking.status) {
      case BookingStatus.ACCEPTED:
        actions.push(
          <Button
            key="payment"
            size="sm"
            onClick={() => handlePayment(booking.id)}
            disabled={actionLoading === booking.id}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Make Payment
          </Button>
        )
        break
      
      case BookingStatus.IN_PROGRESS:
        // Check if event has ended to show finalize button
        const eventDate = new Date(booking.event.eventDate)
        const eventEndTime = booking.eventEndDateTime 
          ? new Date(booking.eventEndDateTime)
          : new Date(eventDate.getTime() + (booking.event.duration || 0) * 60 * 60 * 1000)
        const now = new Date()
        const isEventOver = eventEndTime <= now
        
        if (isEventOver) {
          actions.push(
            <Button
              key="finalize"
              size="sm"
              onClick={() => {
                setSelectedBooking(booking)
                setFinalizeModalOpen(true)
              }}
              disabled={actionLoading === booking.id}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalize Booking
            </Button>
          )
        }
        break
      
      case BookingStatus.COMPLETED:
        actions.push(
          <Button key="review" size="sm" variant="outline" asChild>
            <a href="/organizer/reviews">
              <Star className="mr-2 h-4 w-4" />
              Leave Review
            </a>
          </Button>
        )
        break
    }

    if (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.ACCEPTED) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="outline"
          onClick={() => handleBookingAction(booking.id, 'cancel')}
          disabled={actionLoading === booking.id}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )
    }

    return actions
  }

  const filteredBookings = data?.bookings?.filter(booking =>
    booking.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.talent.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">
          Manage your talent bookings and payments
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredBookings.filter(b => b.status === BookingStatus.PENDING).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredBookings.filter(b => b.status === BookingStatus.IN_PROGRESS).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredBookings.filter(b => b.status === BookingStatus.COMPLETED).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <EmptyState
            icon={searchTerm || statusFilter !== 'all' ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.icon : EMPTY_STATES.CLIENT_BOOKINGS.icon}
            title={searchTerm || statusFilter !== 'all' ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.title : EMPTY_STATES.CLIENT_BOOKINGS.title}
            description={searchTerm || statusFilter !== 'all' ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.description : EMPTY_STATES.CLIENT_BOOKINGS.description}
            size="lg"
            action={{
              label: searchTerm || statusFilter !== 'all' ? 'Clear Filters' : 'Browse Talents',
              onClick: () => {
                if (searchTerm || statusFilter !== 'all') {
                  setSearchTerm('')
                  setStatusFilter('all')
                } else {
                  window.location.href = '/marketplace'
                }
              }
            }}
          />
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{booking.event.title}</CardTitle>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {booking.talent.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(booking.event.eventDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(booking.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/organizer/bookings/${booking.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/organizer/messages">
                        <MessageSquare className="h-4 w-4" />
                      </a>
                    </Button>
                    <RaiseDisputeButton 
                      booking={booking as any} 
                      onDisputeRaised={handleDisputeRaised}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{booking.talent.talentProfile?.category}</Badge>
                  <div className="flex gap-2">
                    {getStatusActions(booking)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * data.pagination.limit) + 1} to {Math.min(currentPage * data.pagination.limit, data.pagination.total)} of {data.pagination.total} bookings
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {data.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === data.pagination.pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Finalize Booking Modal */}
      {selectedBooking && (
        <BookingFinalizeModal
          isOpen={finalizeModalOpen}
          onClose={() => {
            setFinalizeModalOpen(false)
            setSelectedBooking(null)
          }}
          booking={selectedBooking}
          onBookingFinalized={handleBookingFinalized}
        />
      )}
    </div>
  )
}
