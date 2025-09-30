
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OrganizerProfileHeader } from '@/components/organizer/OrganizerProfileHeader'
import { OrganizerEventCard } from '@/components/organizer/OrganizerEventCard'
import { 
  Star, 
  MapPin, 
  Calendar, 
  Globe, 
  CheckCircle,
  Users,
  Trophy,
  Clock
} from 'lucide-react'

interface OrganizerProfileViewProps {
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
    memberSince: string
    totalEvents: number
    completedEvents: number
    averageRating: number
    totalReviews: number
    events: Array<{
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
    }>
    reviews: Array<{
      id: string
      rating: number
      comment: string
      reviewerType: string
      createdAt: string
      reviewer: {
        name: string
        image: string | null
        category: string | null
        username: string | null
      }
      event: {
        title: string
        category: string[]
      }
    }>
  }
}

export function OrganizerProfileView({ profile }: OrganizerProfileViewProps) {
  const [activeTab, setActiveTab] = useState('events')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatBudget = (budget: number | null, budgetMin: number | null, budgetMax: number | null) => {
    if (budget) {
      return `KES ${budget.toLocaleString()}`
    }
    if (budgetMin && budgetMax) {
      return `KES ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}`
    }
    if (budgetMin) {
      return `From KES ${budgetMin.toLocaleString()}`
    }
    if (budgetMax) {
      return `Up to KES ${budgetMax.toLocaleString()}`
    }
    return 'Budget not specified'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <OrganizerProfileHeader profile={profile} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{profile.totalEvents}</p>
                  <p className="text-sm text-gray-600">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{profile.completedEvents}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{profile.averageRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{profile.totalReviews}</p>
                  <p className="text-sm text-gray-600">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Open Events ({profile.events.length})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({profile.totalReviews})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {profile.events.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {profile.events.map((event) => (
                  <OrganizerEventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Open Events</h3>
                  <p className="text-gray-600">This organizer doesn't have any open events at the moment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {profile.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">Bio</h4>
                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.location && (
                    <div>
                      <h4 className="font-semibold mb-2">Location</h4>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    </div>
                  )}

                  {profile.website && (
                    <div>
                      <h4 className="font-semibold mb-2">Website</h4>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-700" />
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Member Since</h4>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(profile.memberSince)}</span>
                    </div>
                  </div>

                  {profile.verified && (
                    <div>
                      <h4 className="font-semibold mb-2">Verification</h4>
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Verified Organizer</span>
                      </div>
                    </div>
                  )}
                </div>

                {profile.eventTypes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Event Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.eventTypes.map((type, index) => (
                        <Badge key={index} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {profile.reviews.length > 0 ? (
              <div className="space-y-4">
                {profile.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={review.reviewer.image || undefined} />
                          <AvatarFallback>
                            {review.reviewer.name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{review.reviewer.name}</h4>
                              {review.reviewer.category && (
                                <p className="text-sm text-gray-600">{review.reviewer.category}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Event: {review.event.title}</span>
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600">This organizer hasn't received any reviews yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
