
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Star, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Eye,
  ArrowLeft,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

interface TalentProfile {
  category: string | null
  averageRating: number | null
  totalReviews: number
  bio: string | null
  location: string | null
  hourlyRate: number | null
}

interface TalentApplication {
  id: string
  status: BookingStatus
  amount: number
  createdAt: string
  notes: string | null
  talent: {
    id: string
    name: string | null
    email: string
    talentProfile: TalentProfile | null
  }
}

interface EventData {
  id: string
  title: string
  description: string
  category: string
  location: string
  eventDate: string
  budget: number
  bookings: TalentApplication[]
}

export default function EventApplicantsPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organizer/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event data')
      }
      
      const result = await response.json()
      if (result.success) {
        setEvent(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch event data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline') => {
    try {
      setActionLoading(bookingId)
      const response = await fetch(`/api/organizer/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        fetchEventData() // Refresh the data
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to update application')
      }
    } catch (err) {
      setError('Failed to update application')
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

  const getApplicationActions = (application: TalentApplication) => {
    if (application.status !== BookingStatus.PENDING) {
      return null
    }

    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handleBookingAction(application.id, 'accept')}
          disabled={actionLoading === application.id}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBookingAction(application.id, 'decline')}
          disabled={actionLoading === application.id}
        >
          <X className="mr-2 h-4 w-4" />
          Decline
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
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

  if (error || !event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {error || 'Event not found'}
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
          Back to Events
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Applications for {event.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
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
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      {/* Event Description */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{event.description}</p>
          <div className="mt-4">
            <Badge variant="outline">{event.category}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Applications Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.bookings?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.bookings?.filter(b => b.status === BookingStatus.PENDING).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.bookings?.filter(b => b.status === BookingStatus.ACCEPTED).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.bookings?.filter(b => b.status === BookingStatus.IN_PROGRESS).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {!event.bookings || event.bookings.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-4">
                No talent has applied to this event yet. Share your event or browse talents to invite them.
              </p>
              <Button asChild>
                <Link href="/marketplace">
                  <Eye className="mr-2 h-4 w-4" />
                  Browse Marketplace
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          event.bookings.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" alt={application.talent.name || ''} />
                      <AvatarFallback>
                        {application.talent.name?.charAt(0)?.toUpperCase() || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{application.talent.name || 'Anonymous Talent'}</CardTitle>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {application.talent.talentProfile?.category && (
                          <Badge variant="outline">{application.talent.talentProfile.category}</Badge>
                        )}
                        {application.talent.talentProfile?.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {application.talent.talentProfile.location}
                          </div>
                        )}
                        {application.talent.talentProfile?.averageRating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-400" />
                            {parseFloat(application.talent.talentProfile.averageRating.toString()).toFixed(1)} 
                            ({application.talent.talentProfile.totalReviews})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{formatCurrency(application.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        Applied {formatDate(application.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {application.talent.talentProfile?.bio && (
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {application.talent.talentProfile.bio}
                  </p>
                )}
                {application.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Application Notes:</h4>
                    <p className="text-sm text-muted-foreground">{application.notes}</p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/organizer/messages">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Chat
                      </Link>
                    </Button>
                  </div>
                  {getApplicationActions(application)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
