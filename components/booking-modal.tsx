
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, MapPin, MessageSquare, Package, User } from 'lucide-react'
import { toast } from 'sonner'
import { UserRole } from '@prisma/client'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  packageData: {
    id: string
    title: string
    category: string
    price: number
    duration: string
    provider: {
      id: string
      name: string
      location: string
      verified: boolean
    }
  }
}

export function BookingModal({ isOpen, onClose, packageData }: BookingModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    eventDate: '',
    venue: '',
    message: ''
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('Please log in to book a package')
      router.push('/auth/login')
      return
    }

    if (session.user.role !== UserRole.ORGANIZER) {
      toast.error('Only event organizers can book packages')
      return
    }

    if (!formData.eventDate || !formData.venue) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const eventDateISO = new Date(formData.eventDate).toISOString()
      
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          talentId: packageData.provider.id,
          packageTitle: packageData.title,
          eventDate: eventDateISO,
          venue: formData.venue,
          message: formData.message,
          budget: packageData.price,
          duration: packageData.duration,
          isCustomBooking: false
        }),
      })

      let result: any = { success: false }
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        result = await response.json()
      } else {
        result.error = `Unexpected response (${response.status})`
      }

      if (response.ok && result.success) {
        toast.success('Booking request sent successfully! The talent will review your request.')
        onClose()
        router.push('/organizer/bookings')
      } else {
        throw new Error(result.error || 'Failed to send booking request')
      }
    } catch (err) {
      console.error('Booking error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to send booking request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to sign in to book this package.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push('/auth/login')} className="flex-1">
              Sign In
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Book Package
          </DialogTitle>
          <DialogDescription>
            Send a booking request to the talent for this package.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{packageData.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  {packageData.provider.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {packageData.provider.location}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(packageData.price)}
                </div>
                <div className="text-sm text-gray-500">
                  Duration: {packageData.duration}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form - Only organizers can reach this point due to early return above */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="eventDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Date *
              </Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="venue" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Event Venue *
              </Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                placeholder="Enter the event location"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Additional Message
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Any additional details or special requirements..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Sending...' : 'Send Booking Request'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
