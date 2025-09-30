
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Star,
  User,
  Calendar,
  AlertCircle,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { EMPTY_STATES } from '@/lib/empty-states'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  User_Review_giverIdToUser: {
    id: string
    name: string
    organizerProfile?: {
      companyName: string | null
    }
  }
  Booking: {
    id: string
    Event: {
      title: string
      eventDate: Date
    } | null
  } | null
}

interface ReviewsData {
  reviews: Review[]
  summary: {
    total: number
    averageRating: number
    ratingSummary: Array<{
      rating: number
      _count: {
        rating: number
      }
    }>
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TalentReviews() {
  const [data, setData] = useState<ReviewsData | null>({
    reviews: [],
    summary: {
      total: 0,
      averageRating: 0,
      ratingSummary: []
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/talent/reviews')
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch reviews')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getRatingDistribution = () => {
    if (!data?.summary?.ratingSummary) return []
    
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const found = data?.summary.ratingSummary.find(r => r.rating === rating)
      const count = found?._count?.rating || 0
      const total = data?.summary?.total || 0
      return {
        rating,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }
    })
    
    return distribution
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading reviews: {error}</span>
            </div>
            <Button onClick={() => fetchReviews()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ensure we have valid summary data
  const summary = data?.summary || {
    total: 0,
    averageRating: 0,
    ratingSummary: []
  }

  const ratingDistribution = getRatingDistribution()

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground">No reviews data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild>
          <Link href="/talent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">
          See what clients are saying about your services
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rating Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Rating Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {summary.averageRating 
                  ? parseFloat(summary.averageRating.toString()).toFixed(1)
                  : '0.0'}
              </div>
              {renderStars(Math.round(summary.averageRating 
                ? parseFloat(summary.averageRating.toString())
                : 0), 'md')}
              <p className="text-sm text-muted-foreground mt-2">
                Based on {summary.total} {summary.total === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {data.reviews.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.TALENT_REVIEWS.icon}
              title={EMPTY_STATES.TALENT_REVIEWS.title}
              description={EMPTY_STATES.TALENT_REVIEWS.description}
              size="lg"
              action={{
                label: 'View Available Bookings',
                onClick: () => window.location.href = '/talent/bookings'
              }}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Client Reviews</h2>
                <Badge>
                  {data.reviews.length} of {summary.total}
                </Badge>
              </div>

              {data.reviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow mb-4">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">
                            {review.User_Review_giverIdToUser.organizerProfile?.companyName || 
                             review.User_Review_giverIdToUser.name}
                          </h4>
                        </div>
                        {review.Booking?.Event?.eventDate && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.Booking.Event.eventDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{review.rating}.0</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm">{review.comment || 'No comment provided'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {data.pagination.pages > 1 && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Showing {data.reviews.length} of {summary.total} {summary.total === 1 ? 'review' : 'reviews'}
                    </p>
                    <Button className="mt-2" disabled>
                      Load More Reviews
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Improve Your Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
            <div>• Communicate clearly with clients before and during events</div>
            <div>• Arrive on time and be well-prepared</div>
            <div>• Follow up after events to ensure satisfaction</div>
            <div>• Be professional and responsive to messages</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
