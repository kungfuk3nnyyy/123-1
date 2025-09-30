

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DisputeReason, UserRole } from '@prisma/client'
import { 
  ORGANIZER_DISPUTE_REASONS, 
  TALENT_DISPUTE_REASONS, 
  DISPUTE_REASON_LABELS 
} from '@/lib/types'
import type { Booking } from '@prisma/client'

interface BookingWithEvent extends Booking {
  event?: {
    title: string
    eventDate: Date
  }
}

interface DisputeSubmissionModalProps {
  booking: BookingWithEvent
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function DisputeSubmissionModal({
  booking,
  isOpen,
  onClose,
  onSuccess
}: DisputeSubmissionModalProps) {
  const { data: session } = useSession()
  const [reason, setReason] = useState<DisputeReason | ''>('')
  const [explanation, setExplanation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userRole = session?.user?.role
  const isOrganizer = userRole === UserRole.ORGANIZER
  const isTalent = userRole === UserRole.TALENT

  // Get role-specific dispute reasons
  const availableReasons = isOrganizer 
    ? ORGANIZER_DISPUTE_REASONS 
    : isTalent 
    ? TALENT_DISPUTE_REASONS 
    : []

  const handleSubmit = async () => {
    if (!reason || !explanation.trim()) {
      toast.error('Please select a reason and provide an explanation')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/bookings/${booking.id}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          explanation: explanation.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Dispute raised successfully. An admin will review your case.')
        setReason('')
        setExplanation('')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to raise dispute')
      }
    } catch (error) {
      console.error('Error raising dispute:', error)
      toast.error('Failed to raise dispute. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('')
      setExplanation('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Raise a Dispute
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Event:</strong> {booking.event?.title}
            </p>
            <p className="text-sm text-amber-800">
              <strong>Amount:</strong> KES {booking.amount?.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Dispute</Label>
            <Select value={reason} onValueChange={(value: DisputeReason) => setReason(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {availableReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {DISPUTE_REASON_LABELS[reasonOption as keyof typeof DISPUTE_REASON_LABELS]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Detailed Explanation</Label>
            <Textarea
              id="explanation"
              placeholder="Please provide a detailed explanation of the issue..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {explanation.length}/500 characters
            </p>
          </div>

          <div className="p-3 bg-calm-soft-blue/10 border border-calm-soft-blue/30 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Once a dispute is raised, the booking funds will be held until 
              an admin reviews and resolves the case. Both parties will be notified of the resolution.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || !explanation.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Raising Dispute...
              </>
            ) : (
              'Raise Dispute'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
