'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  AlertCircle,
  Loader2,
  Star,
  Edit
} from 'lucide-react'
import Link from 'next/link'

interface Applicant {
  id: string;
  name: string | null;
  image: string | null;
  talentProfile: {
    category: string | null;
    averageRating: number | null;
  } | null;
}

interface Booking {
  id: string;
  status: string;
  talent: Applicant;
}

interface EventDetails {
  id: string;
  title: string;
  description: string;
  category: string[];
  location: string;
  eventDate: string;
  budget: number | null;
  bookings: Booking[];
}

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchEventDetails()
    }
  }, [params.id])

  const fetchEventDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/organizer/events/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setEvent(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch event details')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A'
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-red-700">Something went wrong</h3>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button onClick={fetchEventDetails} className="mt-4">Try Again</Button>
      </div>
    )
  }
  
  if (!event) return null;

  const applicants = event.bookings.map(b => b.talent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/organizer/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
        </div>
        <Button asChild>
          <Link href={`/organizer/events/${event.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Event
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground gap-4 pt-2">
            <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /><span>{formatDate(event.eventDate)}</span></div>
            <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /><span>{event.location}</span></div>
            <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /><span>{formatCurrency(event.budget)}</span></div>
          </div>
          <div className="pt-2">
            {event.category.map(cat => <Badge key={cat} variant="secondary" className="mr-1">{cat}</Badge>)}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{event.description}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Talent Applicants ({applicants.length})
          </CardTitle>
          <CardDescription>
            Review the profiles of talents who have applied for this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applicants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No applications yet.</p>
          ) : (
            <div className="space-y-4">
              {applicants.map(talent => (
                <div key={talent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={talent.image || ''} alt={talent.name || 'Talent'} />
                      <AvatarFallback>{talent.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{talent.name}</p>
                      <p className="text-sm text-muted-foreground">{talent.talentProfile?.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span>{talent.talentProfile?.averageRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/talent/${talent.id}`}>View Profile</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}