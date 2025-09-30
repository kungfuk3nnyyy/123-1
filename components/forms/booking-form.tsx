
'use client'

import { useState } from 'react'
import { useZodForm } from '@/hooks/useZodForm'
import { bookingSchema, type BookingFormData } from '@/lib/validation/schemas'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, Phone, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BookingFormProps {
  packageId: string
  packageTitle: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function BookingForm({ packageId, packageTitle, onSuccess, onCancel }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useZodForm(bookingSchema, {
    defaultValues: {
      packageId,
      eventDate: undefined,
      startTime: '',
      duration: 4,
      location: '',
      specialRequests: '',
      contactPhone: '',
      emergencyContact: {
        name: '',
        phone: ''
      },
      agreedToTerms: false
    }
  })

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Booking request submitted successfully!')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to submit booking request')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection
        title="Booking Details"
        description={`Book "${packageTitle}" for your event`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Event Date"
            error={errors.eventDate}
            required
          >
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('eventDate', { valueAsDate: true })}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField
            label="Start Time"
            error={errors.startTime}
            required
          >
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('startTime')}
                type="time"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Duration (Hours)"
            error={errors.duration}
            required
          >
            <Input
              {...register('duration', { valueAsNumber: true })}
              type="number"
              min="1"
              max="24"
              step="0.5"
              placeholder="4"
            />
          </FormField>

          <FormField
            label="Contact Phone"
            error={errors.contactPhone}
            required
          >
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('contactPhone')}
                type="tel"
                placeholder="+254712345678"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>

        <FormField
          label="Event Location"
          error={errors.location}
          required
        >
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              {...register('location')}
              placeholder="Enter the full event address"
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField
          label="Special Requests"
          error={errors.specialRequests}
          description="Any special requirements or additional information"
        >
          <Textarea
            {...register('specialRequests')}
            placeholder="Please describe any special requirements, setup needs, or additional services..."
            rows={3}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Emergency Contact"
        description="Provide an emergency contact for the event day"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Emergency Contact Name"
            error={errors.emergencyContact?.name}
            required
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('emergencyContact.name')}
                placeholder="Full name"
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField
            label="Emergency Contact Phone"
            error={errors.emergencyContact?.phone}
            required
          >
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('emergencyContact.phone')}
                type="tel"
                placeholder="+254712345678"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Terms & Conditions">
        <FormField
          error={errors.agreedToTerms}
          required
        >
          <div className="flex items-start space-x-3">
            <input
              {...register('agreedToTerms')}
              type="checkbox"
              className="mt-1"
            />
            <div className="text-sm">
              <p>
                I agree to the booking terms and conditions, including:
              </p>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li>• Payment terms and cancellation policy</li>
                <li>• Event setup and breakdown requirements</li>
                <li>• Liability and insurance coverage</li>
                <li>• Communication and coordination expectations</li>
              </ul>
            </div>
          </div>
        </FormField>
      </FormSection>

      <div className="flex gap-4 justify-end pt-6 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <FormSubmitButton
          isSubmitting={isSubmitting}
          isValid={isValid}
          className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit Booking Request
        </FormSubmitButton>
      </div>
    </form>
  )
}
