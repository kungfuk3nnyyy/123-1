
'use client'

import { useState } from 'react'
import { useZodForm } from '@/hooks/useZodForm'
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validation/schemas'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Phone, MapPin, Globe, DollarSign, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileFormProps {
  initialData?: Partial<ProfileUpdateFormData>
  onSuccess?: () => void
}

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 
  'Garissa', 'Kakamega', 'Meru', 'Nyeri', 'Machakos', 'Kericho', 'Embu', 'Kisii'
]

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skills, setSkills] = useState<string[]>(initialData?.skills || [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useZodForm(profileUpdateSchema, {
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      phone: initialData?.phone || '',
      bio: initialData?.bio || '',
      location: initialData?.location || '',
      website: initialData?.website || '',
      socialMedia: initialData?.socialMedia || {
        instagram: '',
        twitter: '',
        facebook: '',
        linkedin: ''
      },
      experience: initialData?.experience || '',
      hourlyRate: initialData?.hourlyRate || undefined
    }
  })

  const onSubmit = async (data: ProfileUpdateFormData) => {
    setIsSubmitting(true)

    try {
      const profileData = {
        ...data,
        skills
      }

      const response = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Profile updated successfully!')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()])
    }
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormSection
        title="Basic Information"
        description="Update your basic profile information"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="First Name"
            error={errors.firstName}
            required
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('firstName')}
                placeholder="Enter your first name"
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField
            label="Last Name"
            error={errors.lastName}
            required
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('lastName')}
                placeholder="Enter your last name"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>

        <FormField
          label="Phone Number"
          error={errors.phone}
          required
        >
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              {...register('phone')}
              type="tel"
              placeholder="+254712345678"
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField
          label="Bio"
          error={errors.bio}
          description="Tell clients about yourself and your services"
        >
          <Textarea
            {...register('bio')}
            placeholder="Write a brief description about yourself, your experience, and what makes you unique..."
            rows={4}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Location"
            error={errors.location}
          >
            <Select onValueChange={(value) => setValue('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your location" />
              </SelectTrigger>
              <SelectContent>
                {KENYAN_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Hourly Rate (KES)"
            error={errors.hourlyRate}
            description="Optional - your standard hourly rate"
          >
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('hourlyRate', { valueAsNumber: true })}
                type="number"
                min="50"
                step="50"
                placeholder="2000"
                className="pl-10"
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Skills & Experience"
        description="Showcase your skills and experience"
      >
        <FormField
          label="Skills"
          description="Add skills relevant to your services (press Enter to add)"
        >
          <div className="space-y-3">
            <Input
              placeholder="e.g., Photography, Event Planning, DJ"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const value = e.currentTarget.value.trim()
                  if (value) {
                    addSkill(value)
                    e.currentTarget.value = ''
                  }
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </FormField>

        <FormField
          label="Experience"
          error={errors.experience}
          description="Describe your professional experience and achievements"
        >
          <Textarea
            {...register('experience')}
            placeholder="Describe your experience, notable projects, achievements, and what sets you apart..."
            rows={4}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Online Presence"
        description="Add your website and social media links"
      >
        <FormField
          label="Website"
          error={errors.website}
        >
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              {...register('website')}
              type="url"
              placeholder="https://yourwebsite.com"
              className="pl-10"
            />
          </div>
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Instagram"
            error={errors.socialMedia?.instagram}
          >
            <Input
              {...register('socialMedia.instagram')}
              placeholder="@yourusername"
            />
          </FormField>

          <FormField
            label="Twitter"
            error={errors.socialMedia?.twitter}
          >
            <Input
              {...register('socialMedia.twitter')}
              placeholder="@yourusername"
            />
          </FormField>

          <FormField
            label="Facebook"
            error={errors.socialMedia?.facebook}
          >
            <Input
              {...register('socialMedia.facebook')}
              placeholder="facebook.com/yourpage"
            />
          </FormField>

          <FormField
            label="LinkedIn"
            error={errors.socialMedia?.linkedin}
          >
            <Input
              {...register('socialMedia.linkedin')}
              placeholder="linkedin.com/in/yourprofile"
            />
          </FormField>
        </div>
      </FormSection>

      <div className="flex justify-end pt-6 border-t">
        <FormSubmitButton
          isSubmitting={isSubmitting}
          isValid={isValid}
          className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Profile
        </FormSubmitButton>
      </div>
    </form>
  )
}
