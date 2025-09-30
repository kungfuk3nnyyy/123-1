

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, CheckCircle, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TalentReviewModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    event: {
      title: string
      eventDate: string
    }
    organizer: {
      name: string
      companyName?: string
    }
    amount: number
    talentAmount: number
  }
  onReviewSubmitted: () => void
}

export default function TalentReviewModal({
  isOpen,
  onClose,
  booking,
  onReviewSubmitted
}: TalentReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleClose = () => {
    if (!loading) {
      setRating(0)
      setComment('')
      setHoverRating(0)
      setError(null)
      setSubmitted(false)
      onClose()
    }
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/talent/bookings/${booking.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null // Send null if comment is empty
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        onReviewSubmitted()
        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (err) {
      setError('Failed to submit review')
    } finally {
      setLoading(false)
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

  const renderStarRating = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 transition-colors"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            disabled={submitted}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Submitted</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Thank You for Your Review!</h3>
              <p className="text-sm text-muted-foreground">
                Your review has been submitted successfully.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <EyeOff className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Double-Blind Review System</h4>
              </div>
              <p className="text-sm text-blue-800">
                Your review will remain private until both parties have reviewed or 48 hours have passed. 
                This ensures honest and unbiased feedback from both sides.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Your Experience</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Rate the Organizer</h3>
            <p className="text-sm text-muted-foreground">
              How was working with {booking.organizer.companyName || booking.organizer.name} for "{booking.event.title}"?
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex justify-center">
                {renderStarRating()}
              </div>
              {rating > 0 && (
                <p className="text-sm text-center text-muted-foreground">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Your Review (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience working with this organizer... (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={500}
                disabled={submitted}
              />
              <p className="text-xs text-muted-foreground">
                {comment.length}/500 characters
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <h4 className="font-medium text-amber-900">Review Visibility</h4>
            </div>
            <p className="text-sm text-amber-800">
              Your review will be kept private until both you and the organizer have submitted reviews, 
              or until 48 hours have passed. This ensures fair and honest feedback.
            </p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={loading || rating === 0}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

