'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface EventType {
  id: string
  title: string
}

interface UserType {
  id: string
  name: string | null
}

interface BookingDetails {
  id: string
  Event: EventType | null
  User_Booking_organizerIdToUser: UserType | null
  status: string
  // Add other necessary fields from your booking model
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setIsMounted(true)
    
    const fetchBooking = async () => {
      try {
        console.log('Fetching booking details for ID:', params.id)
        const response = await fetch(`/api/talent/bookings/${params.id}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to fetch booking details:', response.status, errorText)
          throw new Error(`Failed to fetch booking details: ${response.status}`)
        }
        const data: BookingDetails = await response.json()
        
        // Debug log the received data
        console.log('Received booking data:', JSON.stringify(data, null, 2))
        
        // Validate the response data
        if (!data || !data.id) {
          throw new Error('Invalid booking data received: missing booking ID')
        }
        
        // Ensure we have the required nested data
        if (!data.Event || !data.User_Booking_organizerIdToUser) {
          console.warn('Missing required booking data:', {
            hasEvent: !!data.Event,
            hasOrganizer: !!data.User_Booking_organizerIdToUser
          })
        }
        
        setBooking(data)
      } catch (error) {
        console.error('Error fetching booking:', error)
        toast({
          title: 'Error',
          description: 'Failed to load booking details',
          variant: 'destructive',
        })
        router.push('/talent/bookings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/talent/bookings/${params.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      toast({
        title: 'Success',
        description: 'Your review has been submitted successfully!',
      })

      router.push(`/talent/bookings/${params.id}`)
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render anything on the server
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Booking Not Found</h1>
        <p>The booking you're trying to review could not be found.</p>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/talent/bookings')}
        >
          Back to Bookings
        </Button>
      </div>
    )
  }

  // Check if booking data is valid for review
  if (!booking || !booking.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Invalid Booking</h1>
        <p>Unable to load booking details. The booking may be incomplete or you may not have permission to view it.</p>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/talent/bookings')}
          type="button"
        >
          Back to Bookings
        </Button>
      </div>
    )
  }
  
  // Safely get event title
  const eventTitle = booking?.Event?.title || 'this event'

  return (
    <div className="container mx-auto px-4 py-8" key="review-page">
      <h1 className="text-2xl font-bold mb-2">Leave a Review</h1>
      <p className="text-gray-600 mb-6">
        {booking.User_Booking_organizerIdToUser?.name 
          ? `Share your experience working with ${booking.User_Booking_organizerIdToUser.name}`
          : 'Share your experience working with the organizer'}
        {` for "${eventTitle}"`}
      </p>
      
      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setRating(star)
                  }
                }}
                aria-label={`Rate ${star} out of 5`}
                className={`text-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                <span aria-hidden="true">★</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </div>
  )
}
