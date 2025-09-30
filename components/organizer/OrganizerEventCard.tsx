
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface OrganizerEventCardProps {
  event: {
    id: string
    title: string
    description: string
    category: string[]
    location: string
    eventDate: string
    duration: number | null
    requirements: string | null
    budget: number | null
    budgetMin: number | null
    budgetMax: number | null
    status: string
    proposalCount: number
  }
}

export function OrganizerEventCard({ event }: OrganizerEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatBudget = () => {
    if (event.budget) {
      return `KES ${event.budget.toLocaleString()}`
    }
    if (event.budgetMin && event.budgetMax) {
      return `KES ${event.budgetMin.toLocaleString()} - ${event.budgetMax.toLocaleString()}`
    }
    if (event.budgetMin) {
      return `From KES ${event.budgetMin.toLocaleString()}`
    }
    if (event.budgetMax) {
      return `Up to KES ${event.budgetMax.toLocaleString()}`
    }
    return 'Budget not specified'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Open for Applications'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'DRAFT':
        return 'Draft'
      default:
        return status
    }
  }

  const { date, time } = formatDate(event.eventDate)
  const truncatedDescription = event.description.length > 150 
    ? event.description.substring(0, 150) + '...' 
    : event.description

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 line-clamp-2">
              {event.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {event.category.slice(0, 3).map((cat, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {event.category.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{event.category.length - 3}
                </Badge>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(event.status)}>
            {formatStatus(event.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {isExpanded ? event.description : truncatedDescription}
          </p>
          {event.description.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 text-sm mt-1 font-medium"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <div>
              <div className="font-medium">{date}</div>
              <div className="text-xs">{time}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          {event.duration && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{event.duration} hours</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{formatBudget()}</span>
          </div>
        </div>

        {/* Requirements */}
        {event.requirements && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Requirements</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{event.requirements}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{event.proposalCount} proposals</span>
          </div>

          <div className="flex space-x-2">
            <Link href={`/marketplace/events/${event.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            <Link href={`/marketplace/events/${event.id}/apply`}>
              <Button size="sm">
                Apply Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
