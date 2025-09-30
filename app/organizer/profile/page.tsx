
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, User, Building, Globe, Phone, MapPin, Calendar, X, Plus } from 'lucide-react'

interface OrganizerProfileData {
  firstName: string
  lastName: string
  email: string
  companyName: string
  bio: string
  website: string
  phoneNumber: string
  location: string
  eventTypes: string[]
  totalEvents: number
  averageRating: number | null
}

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 
  'Garissa', 'Kakamega', 'Meru', 'Nyeri', 'Machakos', 'Kericho', 'Embu', 'Kisii'
]

const EVENT_TYPE_OPTIONS = [
  'Corporate Events', 'Weddings', 'Birthday Parties', 'Conferences', 'Workshops',
  'Product Launches', 'Networking Events', 'Charity Events', 'Cultural Events',
  'Sports Events', 'Music Concerts', 'Art Exhibitions', 'Trade Shows', 'Seminars'
]

export default function OrganizerProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<OrganizerProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    bio: '',
    website: '',
    phoneNumber: '',
    location: '',
    eventTypes: [],
    totalEvents: 0,
    averageRating: null
  })
  const [newEventType, setNewEventType] = useState('')

  // Redirect if not authenticated or not an organizer
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'ORGANIZER') {
      router.push('/auth/login')
      return
    }
  }, [session, status, router])

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/organizer/profile')
        const result = await response.json()

        if (response.ok) {
          setProfileData(result.data)
        } else {
          toast.error(result.error || 'Failed to load profile data')
        }
      } catch (error) {
        toast.error('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.role === 'ORGANIZER') {
      fetchProfileData()
    }
  }, [session])

  const handleInputChange = (field: keyof OrganizerProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addEventType = (eventType: string) => {
    if (eventType.trim() && !profileData.eventTypes.includes(eventType.trim())) {
      setProfileData(prev => ({
        ...prev,
        eventTypes: [...prev.eventTypes, eventType.trim()]
      }))
    }
  }

  const removeEventType = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/organizer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session?.user || session.user.role !== 'ORGANIZER') {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organizer Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organizer profile information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile to help talents understand your event organizing needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection
              title="Basic Information"
              description="Your basic profile information"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="First Name" required>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      className="pl-10"
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Last Name" required>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      className="pl-10"
                      required
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="Email Address">
                <Input
                  value={profileData.email}
                  disabled
                  className="bg-muted"
                />
              </FormField>

              <FormField label="Company/Organization Name">
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    value={profileData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter your company or organization name"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    value={profileData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+254712345678"
                    className="pl-10"
                  />
                </div>
              </FormField>
            </FormSection>

            <FormSection
              title="Professional Information"
              description="Information about your event organizing experience"
            >
              <FormField 
                label="Bio" 
                description="Tell talents about your event organizing experience and what types of events you specialize in"
              >
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Describe your experience in event organizing, your approach, and what makes your events special..."
                  rows={4}
                />
              </FormField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Location">
                  <Select 
                    value={profileData.location} 
                    onValueChange={(value) => handleInputChange('location', value)}
                  >
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

                <FormField label="Website">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="pl-10"
                    />
                  </div>
                </FormField>
              </div>

              <FormField 
                label="Event Types" 
                description="Add the types of events you typically organize"
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select 
                      value={newEventType} 
                      onValueChange={setNewEventType}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select event type to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPE_OPTIONS
                          .filter(type => !profileData.eventTypes.includes(type))
                          .map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newEventType) {
                          addEventType(newEventType)
                          setNewEventType('')
                        }
                      }}
                      disabled={!newEventType}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {profileData.eventTypes.map((eventType, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {eventType}
                        <button
                          type="button"
                          onClick={() => removeEventType(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </FormField>
            </FormSection>

            {(profileData.totalEvents > 0 || profileData.averageRating) && (
              <FormSection
                title="Statistics"
                description="Your event organizing statistics"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Events</p>
                        <p className="text-2xl font-bold">{profileData.totalEvents}</p>
                      </div>
                    </div>
                  </div>
                  
                  {profileData.averageRating && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average Rating</p>
                          <p className="text-2xl font-bold">{profileData.averageRating.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            <div className="flex justify-end pt-6 border-t">
              <FormSubmitButton
                isSubmitting={isSubmitting}
                isValid={true}
                className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Profile
              </FormSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
