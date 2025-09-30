

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, CheckCircle, AlertCircle, CreditCard, ArrowRight, ArrowLeft, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BookingFinalizeModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    event: {
      title: string
      eventDate: string
    }
    talent: {
      name: string
    }
    amount: number
    talentAmount: number
  }
  onBookingFinalized: () => void
}

const STEPS = {
  REVIEW: 'review',
  CONFIRMATION: 'confirmation'
} as const

type Step = typeof STEPS[keyof typeof STEPS]

export default function BookingFinalizeModal({
  isOpen,
  onClose,
  booking,
  onBookingFinalized
}: BookingFinalizeModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.REVIEW)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const handleClose = () => {
    if (!loading) {
      setCurrentStep(STEPS.REVIEW)
      setRating(0)
      setComment('')
      setHoverRating(0)
      setError(null)
      setReviewSubmitted(false)
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
      const response = await fetch(`/api/organizer/bookings/${booking.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_review',
          review: { 
            rating, 
            comment: comment.trim() || null // Send null if comment is empty
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setReviewSubmitted(true)
        setCurrentStep(STEPS.CONFIRMATION)
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (err) {
      setError('Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteBooking = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/organizer/bookings/${booking.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_booking'
        })
      })

      const data = await response.json()

      if (data.success) {
        onBookingFinalized()
        handleClose()
      } else {
        setError(data.error || 'Failed to complete booking')
      }
    } catch (err) {
      setError('Failed to complete booking')
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

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Rate Your Experience</h3>
        <p className="text-sm text-muted-foreground">
          How was working with {booking.talent.name} for "{booking.event.title}"?
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
            placeholder="Share your experience working with this talent... (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {comment.length}/500 characters
          </p>
        </div>
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
              Submit Review & Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
        <h3 className="text-lg font-semibold">Review Submitted Successfully</h3>
        <p className="text-sm text-muted-foreground">
          Ready to complete the booking and release payment?
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-900">Payment Release & Review System</h4>
        </div>
        <div className="text-sm text-blue-800 space-y-2">
          <p>By completing this booking, you confirm that:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>The talent has successfully provided the agreed services</li>
            <li>You authorize the release of <strong>{formatCurrency(booking.talentAmount)}</strong> to {booking.talent.name}</li>
            <li>This booking will be marked as completed</li>
            <li>The talent will be notified to submit their review within 48 hours</li>
          </ul>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <h4 className="font-medium text-amber-900">Double-Blind Review System</h4>
        </div>
        <p className="text-sm text-amber-800">
          Reviews will remain private until both parties have submitted their reviews or 48 hours have passed, 
          ensuring honest and unbiased feedback.
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(STEPS.REVIEW)} 
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleCompleteBooking} 
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm & Complete Booking
            </>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === STEPS.REVIEW ? 'Finalize Booking' : 'Complete Booking'}
          </DialogTitle>
        </DialogHeader>
        
        {currentStep === STEPS.REVIEW && renderReviewStep()}
        {currentStep === STEPS.CONFIRMATION && renderConfirmationStep()}
      </DialogContent>
    </Dialog>
  )
}

