'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react'

// A fallback for toast notifications
const toast = {
  success: (message: string) => window.alert(`✅ ${message}`),
  error: (message: string) => window.alert(`❌ ${message}`),
}

interface Organizer {
  name: string | null;
  OrganizerProfile?: {
    companyName: string | null;
  } | null;
}

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  eventDate: string;
  budget: number | null;
  User: Organizer;
}

export default function TalentEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableEvents()
  }, [])

  const fetchAvailableEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/talent/available-events')
      if (!response.ok) {
        throw new Error('Failed to fetch available events')
      }
      const result = await response.json()
      if (result.success) {
        setEvents(result.data)
      } else {
        throw new Error(result.error || 'An unknown error occurred')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (eventId: string) => {
    try {
      setApplying(eventId)
      
      const response = await fetch('/api/talent/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application')
      }

      toast.success('Application submitted successfully!')
      // Refresh the list to remove the applied-for event
      fetchAvailableEvents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setApplying(null)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not specified'
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading events: {error}</span>
            </div>
            <Button onClick={fetchAvailableEvents} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Available Events</h1>
        <p className="text-muted-foreground">
          Browse and apply for events you're interested in.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No Available Events</h3>
          <p>Check back later for new opportunities!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  Posted by {event.User?.OrganizerProfile?.companyName || event.User?.name || 'Organizer'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{event.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{formatCurrency(event.budget)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleApply(event.id)}
                  disabled={!!applying}
                >
                  {applying === event.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}