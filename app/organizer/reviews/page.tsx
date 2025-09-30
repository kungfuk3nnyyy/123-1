'use client'

import React, { useEffect, useState, Suspense, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Import components directly to avoid circular dependencies
const Card = dynamic(() => import('@/components/ui/card').then(mod => mod.Card), { ssr: false })
const CardContent = dynamic(() => import('@/components/ui/card').then(mod => mod.CardContent), { ssr: false })
const CardHeader = dynamic(() => import('@/components/ui/card').then(mod => mod.CardHeader), { ssr: false })
const CardTitle = dynamic(() => import('@/components/ui/card').then(mod => mod.CardTitle), { ssr: false })
const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false })
const Badge = dynamic(() => import('@/components/ui/badge').then(mod => mod.Badge), { ssr: false })
const Textarea = dynamic(() => import('@/components/ui/textarea').then(mod => mod.Textarea), { ssr: false })
const Label = dynamic(() => import('@/components/ui/label').then(mod => mod.Label), { ssr: false })

// Icons
const Star = dynamic(() => import('lucide-react').then(mod => mod.Star), { ssr: false })
const MessageSquare = dynamic(() => import('lucide-react').then(mod => mod.MessageSquare), { ssr: false })
const Calendar = dynamic(() => import('lucide-react').then(mod => mod.Calendar), { ssr: false })
const User = dynamic(() => import('lucide-react').then(mod => mod.User), { ssr: false })
const Award = dynamic(() => import('lucide-react').then(mod => mod.Award), { ssr: false })
const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false })
const Send = dynamic(() => import('lucide-react').then(mod => mod.Send), { ssr: false })
const Loader2 = dynamic(() => import('lucide-react').then(mod => mod.Loader2), { ssr: false })

// Dynamically import Dialog components to avoid SSR issues
const Dialog = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.Dialog),
  { 
    ssr: false,
    loading: () => <div className="h-0 w-0" />
  }
)
const DialogContent = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogContent),
  { 
    ssr: false,
    loading: () => <div className="h-0 w-0" />
  }
)
const DialogHeader = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogHeader),
  { 
    ssr: false,
    loading: () => <div className="h-0 w-0" />
  }
)
const DialogTitle = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogTitle),
  { 
    ssr: false,
    loading: () => <div className="h-0 w-0" />
  }
)
const DialogTrigger = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.DialogTrigger),
  { 
    ssr: false,
    loading: () => <div className="h-0 w-0" />
  }
)

// Error Boundary Component
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught by error boundary:', error)
      setHasError(true)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Something went wrong</h3>
        <p className="text-red-700 text-sm mt-1">
          We're having trouble loading reviews. Please try again later.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  receiver: {
    name: string
    talentProfile: {
      category: string
    }
  }
  booking: {
    event: {
      title: string
    }
  }
}

interface PendingReview {
  id: string
  event: {
    title: string
  }
  talent: {
    name: string
    talentProfile: {
      category: string
    }
  }
  updatedAt: string
}

interface ReviewsData {
  reviews: Review[]
  pendingReviews: PendingReview[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Main component with proper error boundary and loading states
function ReviewsContent() {
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({
    bookingId: '',
    rating: 5,
    comment: ''
  })
  const [mounted, setMounted] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching reviews from:', '/api/organizer/reviews')
      const response = await fetch('/api/organizer/reviews')
      
      console.log('Response status:', response.status)
      const responseData = await response.json()
      console.log('Response data:', responseData)
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to fetch reviews')
      }
      
      setData(responseData.data || responseData) // Handle both response structures
      setError(null)
    } catch (err) {
      console.error('Error in fetchReviews:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchReviews()
  }, [fetchReviews])

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Error loading reviews</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
        <button 
          className="mt-2 px-4 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => {
            setError(null)
            setLoading(true)
            fetchReviews()
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  const handleSubmitReview = async (bookingId: string) => {
    if (!bookingId || !reviewForm.comment) return
    
    try {
      setSubmittingReview(reviewForm.bookingId)
      const response = await fetch('/api/organizer/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }

      // Refresh the reviews
      await fetchReviews()
      
      // Reset the form
      setReviewForm({
        bookingId: '',
        rating: 5,
        comment: ''
      })
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmittingReview(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-calm-soft-blue"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchReviews}
                className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">
          Manage talent reviews and feedback
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.reviews?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Reviews submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.pendingReviews?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.reviews?.length ? (
                (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
              ) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Stars given
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {data?.pendingReviews && data.pendingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.pendingReviews.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{booking.event.title}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {booking.talent.name}
                      <Badge variant="outline">
                        {booking.talent.talentProfile?.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Completed {formatDate(booking.updatedAt)}
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setReviewForm({ ...reviewForm, bookingId: booking.id })}
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Leave Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review {booking.talent.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          <div className="mt-2">
                            {renderStars(reviewForm.rating, true, (rating) => {
                              const handleRatingChange = (rating: number) => {
                                setReviewForm(prev => ({ ...prev, rating }))
                              }
                              handleRatingChange(rating)
                            })}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="comment">Comment</Label>
                          <Textarea
                            id="comment"
                            placeholder="Share your experience working with this talent..."
                            value={reviewForm.comment}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              setReviewForm(prev => ({ ...prev, comment: e.target.value }))
                            }}
                            className="mt-2"
                          />
                        </div>
                        <Button 
                          onClick={() => handleSubmitReview(booking.id)}
                          disabled={submittingReview === booking.id}
                          className="w-full"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {submittingReview === booking.id ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews History */}
      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!data?.reviews || data.reviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground">
                  Complete some bookings to start leaving reviews for talents.
                </p>
              </div>
            ) : (
              data.reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{review.booking.event.title}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {review.receiver.name}
                        <Badge variant="outline">
                          {review.receiver.talentProfile?.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {renderStars(review.rating)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <div className="text-sm text-muted-foreground italic">
                      "{review.comment}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Export the main page component
export default function ReviewsPage() {
  return (
    <ErrorBoundary>
      <ReviewsContent />
    </ErrorBoundary>
  )
}
