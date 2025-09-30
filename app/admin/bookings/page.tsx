
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Calendar, 
  Search, 
  Filter,
  RefreshCw,
  Download,
  Eye,
  Settings,
  DollarSign,
  Users,
  AlertTriangle,
  MessageSquare,
  ExternalLink
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

const EMPTY_STATES = {
  ADMIN_BOOKINGS: {
    icon: Calendar,
    title: 'No bookings found',
    description: 'There are no bookings to display at the moment. Check back later or adjust your filters.'
  }
}

interface Booking {
  id: string
  organizerName: string
  organizerEmail: string
  organizerCompany?: string
  talentName: string
  talentEmail: string
  talentCategory?: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  amount: number
  platformFee: number
  talentAmount: number
  status: string
  createdAt: string
  hasDisputes: boolean
  messageCount: number
  transactionStatus: string
}

interface BookingStats {
  totalBookings: number
  pendingBookings: number
  acceptedBookings: number
  completedBookings: number
  disputedBookings: number
  totalRevenue: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

interface DetailedBooking {
  id: string
  status: string
  amount: number
  platformFee: number
  talentAmount: number
  notes?: string
  createdAt: string
  organizer: {
    id: string
    name: string
    email: string
    companyName?: string
    phoneNumber?: string
    location?: string
  }
  talent: {
    id: string
    name: string
    email: string
    category?: string
    phoneNumber?: string
    averageRating?: number
  }
  event: {
    id: string
    title: string
    description: string
    location: string
    eventDate: string
    duration?: number
  }
  transactions: Array<{
    id: string
    type: string
    status: string
    amount: number
    description?: string
    createdAt: string
  }>
  messages: Array<{
    id: string
    content: string
    isRead: boolean
    sender: {
      name: string
      email: string
      role: string
    }
    createdAt: string
  }>
  reviews: Array<{
    id: string
    rating: number
    comment: string
    reviewerType: string
    isVisible: boolean
    giver: {
      name: string
      email: string
      role: string
    }
    createdAt: string
  }>
  disputes: Array<{
    id: string
    reason: string
    explanation: string
    status: string
    disputedBy: {
      name: string
      email: string
      role: string
    }
    createdAt: string
  }>
}

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState<DetailedBooking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; booking: Booking | null }>({
    open: false,
    action: '',
    booking: null
  })
  const [statusOverride, setStatusOverride] = useState('')
  const [overrideNotes, setOverrideNotes] = useState('')

  const handleExportData = () => {
    if (!bookings.length) return
    
    // Create CSV content
    const headers = [
      'Booking ID', 'Organizer', 'Talent', 'Event', 'Date', 'Location', 
      'Amount', 'Platform Fee', 'Talent Amount', 'Status', 'Created At'
    ]
    const csvContent = [
      headers.join(','),
      ...bookings.map(booking => [
        booking.id,
        `"${booking.organizerName}"`,
        `"${booking.talentName}"`,
        `"${booking.eventTitle}"`,
        new Date(booking.eventDate).toLocaleDateString(),
        `"${booking.eventLocation}"`,
        booking.amount,
        booking.platformFee,
        booking.talentAmount,
        booking.status,
        new Date(booking.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/admin/bookings?${params}`)
      const data = await response.json()

      if (response.ok) {
        setBookings(data.bookings || [])
        setStats(data.stats)
        setPagination(data.pagination)
      } else {
        toast.error('Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Error loading bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedBooking(data.booking)
        setDetailsOpen(true)
      } else {
        toast.error('Failed to fetch booking details')
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast.error('Error loading booking details')
    }
  }

  useEffect(() => {
    fetchBookings(currentPage)
  }, [search, statusFilter, currentPage])

  const handleStatusOverride = async () => {
    if (!selectedBooking || !statusOverride) return

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: selectedBooking.id, 
          status: statusOverride,
          notes: overrideNotes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchBookings(currentPage)
        setActionDialog({ open: false, action: '', booking: null })
        setStatusOverride('')
        setOverrideNotes('')
      } else {
        toast.error(data.error || 'Status override failed')
      }
    } catch (error) {
      console.error('Error overriding status:', error)
      toast.error('Error updating booking status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      ACCEPTED: { className: "bg-blue-100 text-blue-800", label: "Accepted" },
      IN_PROGRESS: { className: "bg-purple-100 text-purple-800", label: "In Progress" },
      COMPLETED: { className: "bg-green-100 text-green-800", label: "Completed" },
      CANCELLED: { className: "bg-gray-100 text-gray-800", label: "Cancelled" },
      DECLINED: { className: "bg-red-100 text-red-800", label: "Declined" },
      DISPUTED: { className: "bg-orange-100 text-orange-800", label: "Disputed" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { className: "bg-gray-100 text-gray-800", label: status }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">Booking Management</h1>
          <p className="text-calm-dark-grey/80 mt-2">Monitor and manage all platform bookings</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchBookings(currentPage)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-calm-dark-grey/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings?.toLocaleString() || 0}</div>
            <p className="text-xs text-calm-dark-grey/60">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingBookings || 0}</div>
            <p className="text-xs text-yellow-600">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedBookings || 0}</div>
            <p className="text-xs text-green-600">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.disputedBookings || 0}</div>
            <p className="text-xs text-red-600">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-calm-soft-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-calm-soft-blue">Platform earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.acceptedBookings || 0}</div>
            <p className="text-xs text-blue-600">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Bookings</CardTitle>
          <CardDescription>Find and manage bookings with advanced filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search by booking ID, organizer, talent, or event..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            Complete list of platform bookings 
            {pagination && ` (${pagination.total} total, page ${pagination.page} of ${pagination.pages})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-calm-dark-grey/80">Loading bookings...</span>
            </div>
          ) : bookings?.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.ADMIN_BOOKINGS.icon}
              title={EMPTY_STATES.ADMIN_BOOKINGS.title}
              description={EMPTY_STATES.ADMIN_BOOKINGS.description}
              size="md"
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-calm-light-grey">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-calm-dark-grey">{booking.eventTitle}</h4>
                        {booking.hasDisputes && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                      <p className="text-sm text-calm-dark-grey/80">
                        {booking.organizerName} → {booking.talentName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.eventDate).toLocaleDateString()} • {booking.eventLocation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(booking.amount)}</p>
                      <p className="text-xs text-gray-500">Fee: {formatCurrency(booking.platformFee)}</p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(booking.status)}
                      {booking.messageCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MessageSquare className="h-3 w-3" />
                          {booking.messageCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => fetchBookingDetails(booking.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(booking as any)
                          setActionDialog({ 
                            open: true, 
                            action: 'override_status', 
                            booking 
                          })
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Override
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-calm-dark-grey/80">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details: {selectedBooking?.event?.title ?? 'No Event Title'}</DialogTitle>
            <DialogDescription>
              Complete booking information including messages and transaction history
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Organizer Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Name:</strong> {selectedBooking?.organizer?.name ?? 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedBooking?.organizer?.email ?? 'N/A'}</p>
                    {selectedBooking?.organizer?.companyName && (
                      <p><strong>Company:</strong> {selectedBooking?.organizer?.companyName}</p>
                    )}
                    {selectedBooking?.organizer?.phoneNumber && (
                      <p><strong>Phone:</strong> {selectedBooking?.organizer?.phoneNumber}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Talent Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Name:</strong> {selectedBooking?.talent?.name ?? 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedBooking?.talent?.email ?? 'N/A'}</p>
                    {selectedBooking?.talent?.category && (
                      <p><strong>Category:</strong> {selectedBooking?.talent?.category}</p>
                    )}
                    {selectedBooking?.talent?.averageRating && (
                      <p><strong>Rating:</strong> {selectedBooking?.talent?.averageRating?.toFixed(1)}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Financial Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Financial Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(selectedBooking.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Platform Fee</p>
                      <p className="text-lg font-semibold">{formatCurrency(selectedBooking.platformFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Talent Payout</p>
                      <p className="text-lg font-semibold">{formatCurrency(selectedBooking.talentAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              {selectedBooking?.messages?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Message History ({selectedBooking?.messages?.length ?? 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedBooking.messages.slice(-5).map((message) => (
                        <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{message.sender.name} ({message.sender.role})</span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Disputes */}
              {selectedBooking?.disputes?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-600">Active Disputes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedBooking.disputes.map((dispute) => (
                        <div key={dispute.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-red-800">{dispute.reason}</span>
                            <Badge className="bg-red-100 text-red-800">{dispute.status}</Badge>
                          </div>
                          <p className="text-sm text-red-700">{dispute.explanation}</p>
                          <p className="text-xs text-red-600 mt-1">
                            Filed by {dispute.disputedBy.name} on {new Date(dispute.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Override Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Override Booking Status</AlertDialogTitle>
            <AlertDialogDescription>
              Manually change the status of booking for <strong>{actionDialog.booking?.eventTitle}</strong>.
              This action will be logged for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select value={statusOverride} onValueChange={setStatusOverride}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Reason for status change..."
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusOverride}
              disabled={!statusOverride}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Override Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
