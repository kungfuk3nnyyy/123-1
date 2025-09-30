'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  User,
  MapPin,
  Globe,
  Phone,
  Briefcase,
  Star,
  Plus,
  X,
  Save,
  AlertCircle,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Upload,
  FileText,
  Users,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
  image?: string | null
  TalentProfile?: TalentProfile
}

interface TalentProfile {
  id: string
  bio: string | null
  tagline: string | null
  location: string | null
  website: string | null
  phoneNumber: string | null
  mpesaPhoneNumber: string | null;
  category: string | null
  skills: string[]
  experience: string | null
  hourlyRate: number | null
  availability: string | null
  averageRating: any | null
  totalReviews: number
  totalBookings: number
  portfolioItems?: any[]
  socialLinks?: Record<string, string> | null
  epkUrl?: string | null
  pastClients?: string[]
  username?: string | null
  profileViews?: number
}

const CATEGORIES = [
  'Musician',
  'DJ',
  'Photographer',
  'Videographer',
  'Artist',
  'Performer',
  'Speaker',
  'Other'
]

const LOCATIONS = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Kakamega',
  'Other'
]

export default function TalentProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [newClient, setNewClient] = useState('')
  const [epkUploading, setEpkUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    tagline: '',
    location: '',
    website: '',
    phoneNumber: '',
    mpesaPhoneNumber: '',
    category: '',
    skills: [] as string[],
    experience: '',
    hourlyRate: '',
    availability: '',
    username: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      twitter: '',
      facebook: '',
      tiktok: '',
      linkedin: ''
    },
    pastClients: [] as string[]
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/talent/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      if (data.success) {
        setUser(data.data)
        const profile = data.data.TalentProfile
        
        const socialLinks = profile?.socialLinks && typeof profile.socialLinks === 'object' 
          ? profile.socialLinks as Record<string, string>
          : {}

        setFormData({
          name: data.data.name || '',
          bio: profile?.bio || '',
          tagline: profile?.tagline || '',
          location: profile?.location || '',
          website: profile?.website || '',
          mpesaPhoneNumber: profile?.mpesaPhoneNumber || '',
          phoneNumber: profile?.phoneNumber || '',
          category: profile?.category || '',
          skills: profile?.skills || [],
          experience: profile?.experience || '',
          hourlyRate: profile?.hourlyRate ? profile.hourlyRate.toString() : '',
          availability: profile?.availability || '',
          username: profile?.username || '',
          socialLinks: {
            instagram: socialLinks.instagram || '',
            youtube: socialLinks.youtube || '',
            twitter: socialLinks.twitter || '',
            facebook: socialLinks.facebook || '',
            tiktok: socialLinks.tiktok || '',
            linkedin: socialLinks.linkedin || ''
          },
          pastClients: profile?.pastClients || []
        });

        if (data.data.image) {
          setPreview(data.data.image);
        }

      } else {
        throw new Error(data.error || 'Failed to fetch profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateMpesaNumber = async (phoneNumber: string) => {
    try {
      const response = await fetch('/api/profile/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mpesaPhoneNumber: phoneNumber })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update MPESA number');
      }

      return await response.json();
    } catch (error) {
      console.error('MPESA update error:', error);
      throw error;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const formPayload = new FormData();
      formPayload.append('profileData', JSON.stringify(formData));
      if (selectedFile) {
        formPayload.append('profileImage', selectedFile);
      }

      const profileResponse = await fetch('/api/talent/profile', {
        method: 'PUT',
        body: formPayload
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile');
      }

      const profileData = await profileResponse.json();
      
      if (formData.mpesaPhoneNumber) {
        await updateMpesaNumber(formData.mpesaPhoneNumber);
      }

      await fetchProfile();
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err)
      alert(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const addClient = () => {
    if (newClient.trim() && !formData.pastClients.includes(newClient.trim())) {
      setFormData(prev => ({
        ...prev,
        pastClients: [...prev.pastClients, newClient.trim()]
      }))
      setNewClient('')
    }
  }

  const removeClient = (clientToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      pastClients: prev.pastClients.filter(client => client !== clientToRemove)
    }))
  }

  const handleEpkUpload = async (file: File) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB')
      return
    }

    try {
      setEpkUploading(true)
      const formData = new FormData()
      formData.append('epk', file)

      const response = await fetch('/api/talent/epk/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload EPK')
      }

      const data = await response.json()
      if (data.success) {
        alert('EPK uploaded successfully!')
        await fetchProfile()
      } else {
        throw new Error(data.error || 'Failed to upload EPK')
      }
    } catch (error) {
      console.error('EPK upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload EPK')
    } finally {
      setEpkUploading(false)
    }
  }

  const handleSocialLinkChange = (platform: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: url
      }
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading profile: {error}</span>
            </div>
            <Button onClick={fetchProfile} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
        <p className="text-muted-foreground">
          Update your talent profile to attract more clients
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Your personal and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 mb-4">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={preview || undefined} />
                    <AvatarFallback>
                      {formData.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" /> Change Picture
                      <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tagline">Professional Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g., Professional Wedding Photographer"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+254 XXX XXX XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Details
              </CardTitle>
              <CardDescription>Your expertise and service information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="skills">Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button type="button" size="sm" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (KES)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="Intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="Advanced">Advanced (5-10 years)</SelectItem>
                      <SelectItem value="Expert">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="availability">Availability</Label>
                <Select value={formData.availability} onValueChange={(value) => setFormData(prev => ({ ...prev, availability: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="Partially Available">Partially Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Social Media & Online Presence
              </CardTitle>
              <CardDescription>Add links to your social media profiles and portfolio sites</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/yourname"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </Label>
                  <Input
                    id="youtube"
                    value={formData.socialLinks.youtube}
                    onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                    placeholder="https://youtube.com/c/yourname"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter/X
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="https://x.com/yourname"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/yourname"
                  />
                </div>
                <div>
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input
                    id="tiktok"
                    value={formData.socialLinks.tiktok}
                    onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@yourname"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Professional Documents
              </CardTitle>
              <CardDescription>Upload your Electronic Press Kit (EPK) and other documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Public Profile Username (Optional)</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="your-unique-username"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will create a custom URL: gigsecure.com/talent/your-username
                </p>
              </div>

              <div>
                <Label htmlFor="epk-upload">Electronic Press Kit (EPK)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {user?.TalentProfile?.epkUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-600">EPK Uploaded</span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(user.TalentProfile?.epkUrl || '', '_blank')}
                        >
                          View EPK
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('epk-file')?.click()}
                          disabled={epkUploading}
                        >
                          {epkUploading ? 'Uploading...' : 'Replace EPK'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <div className="text-sm text-muted-foreground">
                        <p>Upload your Electronic Press Kit (PDF only, max 10MB)</p>
                        <p className="text-xs mt-1">Include your bio, portfolio, testimonials, and contact info</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('epk-file')?.click()}
                        disabled={epkUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {epkUploading ? 'Uploading...' : 'Choose EPK File'}
                      </Button>
                    </div>
                  )}
                  <input
                    id="epk-file"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleEpkUpload(file)
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Notable Past Clients & Events
              </CardTitle>
              <CardDescription>Showcase your experience with prominent clients or events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="past-clients">Add Notable Client or Event</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="past-clients"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="e.g., Safari.com Wedding Expo, Corporate Event for Safaricom"
                    onKeyPress={(e) => e.key === 'Enter' && addClient()}
                  />
                  <Button type="button" size="sm" onClick={addClient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.pastClients.map((client) => (
                    <Badge key={client} variant="secondary" className="gap-1">
                      {client}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeClient(client)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Profile Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-bold">
                    {user?.TalentProfile?.averageRating 
                      ? parseFloat(user.TalentProfile.averageRating.toString()).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Reviews</span>
                <span className="font-bold">{user?.TalentProfile?.totalReviews || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Bookings</span>
                <span className="font-bold">{user?.TalentProfile?.totalBookings || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio & Stats</CardTitle>
              <CardDescription>Your work showcase and profile metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile Views</span>
                <span className="font-bold">{user?.TalentProfile?.profileViews || 0}</span>
              </div>

              <div className="border-t pt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">Portfolio image management coming soon</p>
                  <Button variant="outline" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Portfolio Images
                  </Button>
                  <p className="text-xs mt-2">Upload your best work photos and videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}