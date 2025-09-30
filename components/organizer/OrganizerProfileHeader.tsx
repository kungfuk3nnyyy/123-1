
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  CheckCircle, 
  MapPin, 
  Globe, 
  Star,
  MessageCircle
} from 'lucide-react'

interface OrganizerProfileHeaderProps {
  profile: {
    id: string
    name: string | null
    displayName: string | null
    bio: string | null
    website: string | null
    profileImage: string | null
    location: string | null
    eventTypes: string[]
    verified: boolean
    averageRating: number
    totalReviews: number
    totalEvents: number
  }
}

export function OrganizerProfileHeader({ profile }: OrganizerProfileHeaderProps) {
  const handleContactOrganizer = () => {
    // This would typically open a contact modal or redirect to messaging
    console.log('Contact organizer:', profile.id)
  }

  const handleVisitWebsite = () => {
    if (profile.website) {
      window.open(profile.website, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-32 w-32">
              <AvatarImage 
                src={profile.profileImage || undefined} 
                alt={profile.displayName || 'Organizer'} 
              />
              <AvatarFallback className="text-2xl">
                {(profile.displayName || profile.name || 'O').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.displayName || profile.name || 'Event Organizer'}
                </h1>
                {profile.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {profile.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.averageRating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{profile.averageRating.toFixed(1)}</span>
                  <span>({profile.totalReviews} reviews)</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <span>{profile.totalEvents} events organized</span>
              </div>
            </div>

            {/* Event Types */}
            {profile.eventTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.eventTypes.slice(0, 5).map((type, index) => (
                  <Badge key={index} variant="outline">
                    {type}
                  </Badge>
                ))}
                {profile.eventTypes.length > 5 && (
                  <Badge variant="outline">
                    +{profile.eventTypes.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 lg:flex-shrink-0">
            <Button 
              onClick={handleContactOrganizer}
              className="w-full lg:w-auto"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Organizer
            </Button>

            {profile.website && (
              <Button 
                variant="outline" 
                onClick={handleVisitWebsite}
                className="w-full lg:w-auto"
              >
                <Globe className="h-4 w-4 mr-2" />
                Visit Website
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
