'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  DollarSign, 
  FileText, 
  Users,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'

const CATEGORIES = [
  'Musician', 'DJ', 'Photographer', 'Videographer', 'Artist', 
  'MC/Host', 'Sound Engineer', 'Lighting Technician'
]

const KENYA_CITIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
  'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Meru',
  'Nyeri', 'Kericho'
]

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [] as string[],
    location: '',
    eventDate: '',
    budget: '',
    requirements: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }
  
  const handleCategoryChange = (category: string) => {
    setFormData(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories: newCategories }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // **CHANGED**: Updated validation to check required fields and the 'categories' array
    const requiredFields = ['title', 'description', 'location', 'eventDate', 'budget']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    if (formData.categories.length === 0) {
      setError('Please select at least one talent category.')
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
        })
      })

      const result = await response.json()
      if (result.success) {
        setSuccess('Event created successfully!')
        setTimeout(() => {
          router.push('/organizer/events')
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to create event')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/organizer/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
          <p className="text-muted-foreground">
            Post a new event to find talented professionals
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Corporate Annual Gala"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Talent Categories *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border p-4">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <Checkbox
                      id={category}
                      checked={formData.categories.includes(category)}
                      onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <Label htmlFor={category} className="cursor-pointer">{category}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Event Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your event..."
                rows={4}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYA_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (KES) *</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="10000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Additional Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Any specific skills, equipment, etc."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating Event...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}