
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { BookingStatus } from '@prisma/client'
import type { Booking } from '@prisma/client'
import DisputeSubmissionModal from './dispute-submission-modal'

interface BookingWithRelations extends Booking {
  event?: {
    title: string
    eventDate: Date
    duration?: number
  }
  disputes?: Array<{
    status: string
  }>
}

interface RaiseDisputeButtonProps {
  booking: BookingWithRelations
  onDisputeRaised?: () => void
}

export default function RaiseDisputeButton({ 
  booking, 
  onDisputeRaised 
}: RaiseDisputeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if dispute can be raised
  const canRaiseDispute = () => {
    // Only allow disputes on confirmed bookings after event date
    const validStatuses: BookingStatus[] = [
      BookingStatus.ACCEPTED, 
      BookingStatus.IN_PROGRESS, 
      BookingStatus.COMPLETED
    ]
    
    if (!validStatuses.includes(booking.status)) {
      return false
    }

    // Check if event has ended
    const now = new Date()
    const eventEndTime = booking.eventEndDateTime 
      ? new Date(booking.eventEndDateTime)
      : new Date((booking.event?.eventDate || new Date()).getTime() + (booking.event?.duration || 0) * 60 * 60 * 1000)
    
    if (eventEndTime > now) {
      return false
    }

    // Check if there's already an active dispute
    const hasActiveDispute = booking.disputes?.some((dispute: any) => 
      dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW'
    )

    return !hasActiveDispute
  }

  const handleSuccess = () => {
    onDisputeRaised?.()
  }

  if (!canRaiseDispute()) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Raise Dispute
      </Button>

      <DisputeSubmissionModal
        booking={booking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
