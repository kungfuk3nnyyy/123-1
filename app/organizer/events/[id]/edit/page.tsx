'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
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

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/organizer/events/${params.id}`);
        const result = await response.json();
        if (result.success) {
          const event = result.data;
          // **FIXED**: Safely handle potentially null or undefined values
          setFormData({
            title: event.title || '',
            description: event.description || '',
            categories: event.category || [],
            location: event.location || '',
            eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
            budget: event.budget?.toString() || '',
            requirements: event.requirements || '',
          });
        } else {
          throw new Error(result.error || 'Failed to fetch event data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
        fetchEventData();
    }
  }, [params.id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (category: string) => {
    setFormData(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/organizer/events/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Event updated successfully!');
        setTimeout(() => router.push('/organizer/events'), 1500);
      } else {
        throw new Error(result.error || 'Failed to update event');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (error) {
    return (
        <div className="p-6">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    )
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
        <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
      </div>

      {success && <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Update Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Talent Categories *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border p-4">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center gap-2">
                    <Checkbox id={cat} checked={formData.categories.includes(cat)} onCheckedChange={() => handleCategoryChange(cat)} />
                    <Label htmlFor={cat} className="cursor-pointer">{cat}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Event Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KENYA_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input id="eventDate" type="datetime-local" value={formData.eventDate} onChange={(e) => handleInputChange('eventDate', e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (KES) *</Label>
              <Input id="budget" type="number" value={formData.budget} onChange={(e) => handleInputChange('budget', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Additional Requirements</Label>
              <Textarea id="requirements" value={formData.requirements} onChange={(e) => handleInputChange('requirements', e.target.value)} rows={3} />
            </div>

            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}