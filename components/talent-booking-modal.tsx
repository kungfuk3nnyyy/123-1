'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MapPin, MessageSquare, Package, User, Star, Shield, DollarSign, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Image from 'next/image'

interface TalentBookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPackageId?: string | null
  talent: {
    id: string
    userId: string
    name: string
    category?: string | null
    location?: string | null
    hourlyRate?: number | null
    averageRating: number
    totalReviews: number
    verified: boolean
    image?: string | null
    packages: Array<{
      id: string
      title: string
      description: string
      price: number
      priceIsHidden?: boolean
      duration?: string | null
    }>
  }
}

export function TalentBookingModal({ isOpen, onClose, selectedPackageId, talent }: TalentBookingModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string>(selectedPackageId || 'custom')
  const [formData, setFormData] = useState({
    eventDate: '',
    venue: '',
    message: '',
    customBudget: ''
  })

  // Update selected package when prop changes
  useEffect(() => {
    if (selectedPackageId && isOpen) {
      setSelectedPackage(selectedPackageId)
    } else if (isOpen && !selectedPackageId) {
      setSelectedPackage('custom')
    }
  }, [selectedPackageId, isOpen])

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

  const getSelectedPackageData = () => {
    if (selectedPackage === 'custom') return null
    return talent.packages.find(pkg => pkg.id === selectedPackage) || null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user) {
      toast.error('Please log in to send a booking request')
      router.push('/auth/login')
      return
    }

    if (session.user.role === 'TALENT') {
      toast.error('Talents cannot book other talents')
      return
    }

    if (session.user.role !== 'ORGANIZER') {
      toast.error('Only event organizers can book talents')
      return
    }

    if (!formData.eventDate || !formData.venue) {
      toast.error('Please fill in all required fields')
      return
    }

    if (selectedPackage === 'custom' && !formData.customBudget) {
      toast.error('Please specify your budget for custom booking')
      return
    }

    setIsSubmitting(true)

    try {
      const selectedPkg = getSelectedPackageData()
      const bookingAmount = selectedPkg ? selectedPkg.price : parseFloat(formData.customBudget)

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPkg?.id || null,
          talentId: talent.userId,
          eventDate: formData.eventDate,
          venue: formData.venue,
          message: formData.message,
          packageTitle: selectedPkg?.title || `Custom booking for ${talent.name}`,
          budget: bookingAmount,
          duration: selectedPkg?.duration || '8 hours',
          isCustomBooking: !selectedPkg
        }),
      })

      let result: any = { success: false }
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        result = await response.json()
      } else {
        // Fallback for HTML/error responses
        result.error = `Unexpected response (${response.status})`
      }

      if (response.ok && result.success) {
        toast.success('Booking request sent successfully! The talent will review your request.')
        onClose()
        resetForm()
        router.push('/organizer/bookings')
      } else {
        toast.error(result.error || 'Failed to send booking request')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to send booking request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ eventDate: '', venue: '', message: '', customBudget: '' })
    setSelectedPackage(selectedPackageId || 'custom')
  }

  const handleLoginRedirect = () => {
    onClose()
    router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.href))
  }

  const handleSignupRedirect = () => {
    onClose()
    router.push('/auth/signup?callbackUrl=' + encodeURIComponent(window.location.href))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Request to Book {talent.name}
          </DialogTitle>
          <DialogDescription>
            Send a booking request to this talent. They will review your request and you'll only pay once they approve.
          </DialogDescription>
        </DialogHeader>

        {/* Talent Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              <Image
                src={talent.image || '/api/placeholder/64/64'}
                alt={talent.name}
                fill
                className="object-cover"
              />
              {talent.verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full">
                  <Shield className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{talent.name}</h3>
                {talent.verified && (
                  <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                {talent.category && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {talent.category}
                  </div>
                )}
                {talent.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {talent.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  {talent.averageRating.toFixed(1)} ({talent.totalReviews} reviews)
                </div>
                {talent.hourlyRate && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(talent.hourlyRate)}/hour
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {!session?.user ? (
          /* Login Prompt */
          <div className="text-center py-6">
            <div className="mb-4">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">Sign in to Continue</h3>
              <p className="text-gray-600 mt-1">You need to be logged in to send a booking request</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleLoginRedirect} className="flex-1">
                Sign In
              </Button>
              <Button onClick={handleSignupRedirect} variant="outline" className="flex-1">
                Create Account
              </Button>
            </div>
          </div>
        ) : session.user.role === 'TALENT' ? (
          /* Talent Role Restriction */
          <div className="text-center py-6">
            <div className="mb-4">
              <User className="mx-auto h-12 w-12 text-orange-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">Talents Cannot Book Other Talents</h3>
              <p className="text-gray-600 mt-1">Only event organizers can send booking requests to talents</p>
            </div>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          /* Booking Form for Organizers */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Package Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Service Type</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Booking</SelectItem>
                  {talent.packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.title} - {pkg.priceIsHidden ? 'Price on request' : formatCurrency(pkg.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Selected Package Details */}
              {selectedPackage !== 'custom' && (
                <div className="bg-blue-50 rounded-lg p-3">
                  {(() => {
                    const pkg = getSelectedPackageData()
                    return pkg ? (
                      <div>
                        <h4 className="font-medium text-blue-900">{pkg.title}</h4>
                        <p className="text-sm text-blue-700 mt-1">{pkg.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          {!pkg.priceIsHidden && (
                            <span className="font-semibold text-blue-900">{formatCurrency(pkg.price)}</span>
                          )}
                          {pkg.duration && (
                            <span className="text-sm text-blue-700">{pkg.duration}</span>
                          )}
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>

            <Separator />

            {/* Event Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Date *
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Event Venue *
                </Label>
                <Input
                  id="venue"
                  type="text"
                  placeholder="Enter event location or venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  required
                />
              </div>

              {/* Custom Budget for custom bookings */}
              {selectedPackage === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customBudget" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Your Budget (KES) *
                  </Label>
                  <Input
                    id="customBudget"
                    type="number"
                    min="1000"
                    placeholder="e.g., 25000"
                    value={formData.customBudget}
                    onChange={(e) => handleInputChange('customBudget', e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Event Description & Requirements
                </Label>
                <Textarea
                  id="message"
                  placeholder="Describe your event, specific requirements, timeline, or any questions you have..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Booking Request'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                No payment required now. You'll only pay once the talent accepts your request.
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
