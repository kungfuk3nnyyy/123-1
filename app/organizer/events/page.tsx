
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Edit, 
  Users, 
  Eye,
  Archive,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description: string
  category: string
  location: string
  eventDate: string
  budget: number
  isActive: boolean
  _count: {
    bookings: number
  }
  createdAt: string
}

interface EventsData {
  events: Event[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function EventsPage() {
  const [data, setData] = useState<EventsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchEvents()
  }, [currentPage, statusFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/organizer/events?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch events')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        fetchEvents() // Refresh the list
      }
    } catch (err) {
      console.error('Failed to update event status:', err)
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

  const filteredEvents = data?.events?.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="grid gap-4">
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
            <p className="text-muted-foreground">Manage your event postings</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span>Error loading events: {error}</span>
            </div>
            <Button onClick={fetchEvents} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground">
            Manage your event postings and applications
          </p>
        </div>
        <Button asChild>
          <Link href="/organizer/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events..."
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
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      <div className="grid gap-4">
        {filteredEvents.length === 0 ? (
          <EmptyState
            icon={searchTerm || statusFilter !== 'all' ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.icon : EMPTY_STATES.CLIENT_EVENTS.icon}
            title={searchTerm || statusFilter !== 'all' ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.title : EMPTY_STATES.CLIENT_EVENTS.title}
            description={searchTerm || statusFilter !== 'all' ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.description : EMPTY_STATES.CLIENT_EVENTS.description}
            size="lg"
            action={{
              label: searchTerm || statusFilter !== 'all' ? 'Clear Filters' : 'Create Your First Event',
              onClick: () => {
                if (searchTerm || statusFilter !== 'all') {
                  setSearchTerm('')
                  setStatusFilter('all')
                } else {
                  window.location.href = '/organizer/events/new'
                }
              }
            }}
          />
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <Badge variant={event.isActive ? 'default' : 'secondary'}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.eventDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(event.budget)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event._count?.bookings ?? 0} Applications
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/organizer/events/${event.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/organizer/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(event.id, event.isActive)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <Badge variant="outline">{event.category}</Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/organizer/events/${event.id}/applicants`}>
                        View Applications ({event._count?.bookings ?? 0})
                      </Link>
                    </Button>
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
            Showing {((currentPage - 1) * data.pagination.limit) + 1} to {Math.min(currentPage * data.pagination.limit, data.pagination.total)} of {data.pagination.total} events
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
    </div>
  )
}
