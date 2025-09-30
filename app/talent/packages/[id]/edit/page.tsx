
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  X,
  ArrowLeft,
  Save,
  Package,
  Camera,
  Music,
  Mic,
  Palette,
  Video,
  Upload,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import type { Package as PackageType, UpdatePackageForm } from '@/lib/types'

const CATEGORIES = [
  { value: 'Photography', label: 'Photography', icon: Camera },
  { value: 'DJ Services', label: 'DJ Services', icon: Mic },
  { value: 'Live Music', label: 'Live Music', icon: Music },
  { value: 'Videography', label: 'Videography', icon: Video },
  { value: 'Art & Design', label: 'Art & Design', icon: Palette },
  { value: 'Entertainment', label: 'Entertainment', icon: Package },
  { value: 'Catering', label: 'Catering', icon: Package },
  { value: 'Decoration', label: 'Decoration', icon: Package },
  { value: 'Other', label: 'Other', icon: Package },
]

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 
  'Garissa', 'Kakamega', 'Meru', 'Nyeri', 'Machakos', 'Kericho', 'Embu', 'Kisii',
  'Naivasha', 'Nyahururu', 'Kapenguria', 'Homa Bay', 'Migori', 'Siaya', 'Busia',
  'Kitui', 'Makueni', 'Machakos', 'Kajiado', 'Kiambu', 'Murang\'a', 'Kirinyaga',
  'Embu', 'Tharaka Nithi', 'Meru', 'Isiolo', 'Marsabit', 'Samburu', 'Laikipia',
  'Nyandarua', 'Nakuru', 'Narok', 'Bomet', 'Kericho', 'Nandi', 'Uasin Gishu',
  'Elgeyo Marakwet', 'West Pokot', 'Turkana', 'Baringo', 'Trans Nzoia', 'Bungoma',
  'Kakamega', 'Vihiga', 'Kisumu', 'Siaya', 'Busia', 'Migori', 'Homa Bay', 'Kisii',
  'Nyamira', 'Taita Taveta', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Garissa',
  'Wajir', 'Mandera'
]

const DURATION_OPTIONS = [
  '1 hour',
  '2 hours', 
  '3 hours',
  '4 hours',
  '6 hours',
  '8 hours',
  'Half day (4 hours)',
  'Full day (8 hours)',
  '2 days',
  '3 days',
  'Weekend',
  'Custom duration'
]

interface EditPackagePageProps {
  params: {
    id: string
  }
}

export default function EditPackagePage({ params }: EditPackagePageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const packageId = params.id
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState<UpdatePackageForm>({
    title: '',
    description: '',
    category: '',
    location: '',
    price: 0,
    priceIsHidden: false,
    duration: '',
    features: [''],
    coverImageUrl: '',
    images: [],
    isPublished: false
  })
  
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Fetch existing package data
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await fetch(`/api/talent/packages/${packageId}`)
        const result = await response.json()

        if (result.success) {
          const pkg: PackageType = result.data
          setFormData({
            title: pkg.title,
            description: pkg.description,
            category: pkg.category,
            location: pkg.location || '',
            price: pkg.price,
            priceIsHidden: pkg.priceIsHidden || false,
            duration: pkg.duration || '',
            features: pkg.features.length > 0 ? pkg.features : [''],
            coverImageUrl: pkg.coverImageUrl || '',
            images: pkg.images || [],
            isPublished: pkg.isPublished
          })
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to fetch package data',
            variant: 'destructive'
          })
          router.push('/talent/packages')
        }
      } catch (error) {
        console.error('Error fetching package:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch package data',
          variant: 'destructive'
        })
        router.push('/talent/packages')
      } finally {
        setFetching(false)
      }
    }

    fetchPackage()
  }, [packageId, router, toast])

  const handleInputChange = (field: keyof UpdatePackageForm, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev: any) => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [''])]
    newFeatures[index] = value
    setFormData((prev: any) => ({
      ...prev,
      features: newFeatures
    }))
  }

  const addFeature = () => {
    setFormData((prev: any) => ({
      ...prev,
      features: [...(prev.features || ['']), '']
    }))
  }

  const removeFeature = (index: number) => {
    const currentFeatures = formData.features || ['']
    if (currentFeatures.length > 1) {
      const newFeatures = currentFeatures.filter((_: any, i: number) => i !== index)
      setFormData((prev: any) => ({
        ...prev,
        features: newFeatures
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'Package title is required'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Package description is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required'
    }

    // Validate features (at least one non-empty feature)
    const validFeatures = (formData.features || []).filter((f: string) => f.trim())
    if (validFeatures.length === 0) {
      newErrors.features = 'At least one feature is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    try {
      // Filter out empty features
      const cleanedFeatures = (formData.features || []).filter((f: string) => f.trim())
      
      const response = await fetch(`/api/talent/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          features: cleanedFeatures,
          price: parseFloat(formData.price?.toString() || '0')
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Package updated successfully!'
        })
        router.push('/talent/packages')
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update package',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating package:', error)
      toast({
        title: 'Error',
        description: 'Failed to update package',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calm-white via-calm-light-grey to-calm-soft-blue/20 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-calm-warm-beige" />
            <span className="text-lg font-medium text-calm-dark-grey">Loading package...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-white via-calm-light-grey to-calm-soft-blue/20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-calm-white to-calm-light-grey border-b-2 border-calm-soft-blue/30 shadow-brand">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-calm-warm-beige to-calm-soft-blue rounded-xl flex items-center justify-center shadow-brand-lg mr-4">
                <Package className="h-6 w-6 text-calm-dark-grey" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-calm-dark-grey">
                  Edit Package
                </h1>
                <p className="text-calm-dark-grey/80 mt-1">
                  Update your service package details
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Publishing Status */}
            <Card className="border-2 border-calm-soft-blue/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-calm-dark-grey">
                  {formData.isPublished ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  )}
                  Publishing Status
                </CardTitle>
                <CardDescription>
                  Control the visibility of your package
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-calm-dark-grey">
                      {formData.isPublished ? 'Published' : 'Draft'}
                    </p>
                    <p className="text-sm text-calm-dark-grey/70">
                      {formData.isPublished ? 
                        'Your package is visible to clients' : 
                        'Your package is hidden from clients'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublished || false}
                    onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="border-2 border-calm-soft-blue/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-calm-dark-grey">
                  <Package className="h-5 w-5 text-calm-warm-beige" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the essential details about your service package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Package Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Package Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Wedding Photography Premium Package"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what's included in this package and what makes it special..."
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Category and Location */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category || ''}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-600">{errors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location Served</Label>
                    <Select
                      value={formData.location || ''}
                      onValueChange={(value) => handleInputChange('location', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary location" />
                      </SelectTrigger>
                      <SelectContent>
                        {KENYAN_COUNTIES.map((county) => (
                          <SelectItem key={county} value={county}>
                            {county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price and Duration */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (KES) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="50000"
                      value={formData.price || ''}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className={errors.price ? 'border-red-500' : ''}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-600">{errors.price}</p>
                    )}
                    
                    {/* Hide Price Toggle */}
                    <div className="flex items-center space-x-3 pt-3 border-t border-calm-soft-blue/20">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="priceIsHidden"
                          checked={formData.priceIsHidden || false}
                          onCheckedChange={(checked) => handleInputChange('priceIsHidden', checked)}
                        />
                        <Label htmlFor="priceIsHidden" className="text-sm font-medium flex items-center gap-2">
                          <EyeOff className="h-4 w-4 text-calm-warm-beige" />
                          Hide Price
                        </Label>
                      </div>
                    </div>
                    <p className="text-xs text-calm-dark-grey/60 mt-1">
                      Display price as "On Inquiry" and require clients to request a custom quote
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={formData.duration || ''}
                      onValueChange={(value) => handleInputChange('duration', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((duration) => (
                          <SelectItem key={duration} value={duration}>
                            {duration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-2 border-calm-soft-blue/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-calm-dark-grey">
                  <Package className="h-5 w-5 text-calm-warm-beige" />
                  Package Features
                </CardTitle>
                <CardDescription>
                  Update what's included in this package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(formData.features || ['']).map((feature: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Feature ${index + 1} (e.g., High-resolution photos)`}
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1"
                    />
                    {(formData.features || []).length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="px-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFeature}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Feature
                </Button>
                
                {errors.features && (
                  <p className="text-sm text-red-600">{errors.features}</p>
                )}
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card className="border-2 border-calm-soft-blue/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-calm-dark-grey">
                  <Upload className="h-5 w-5 text-calm-warm-beige" />
                  Cover Image
                </CardTitle>
                <CardDescription>
                  Update the cover image for your package (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImageUrl">Image URL</Label>
                  <Input
                    id="coverImageUrl"
                    type="url"
                    placeholder="https://i.ytimg.com/vi/CJ91JgXjq_4/maxresdefault.jpg"
                    value={formData.coverImageUrl || ''}
                    onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                  />
                  <p className="text-sm text-calm-dark-grey/60">
                    For now, please provide a direct URL to your image. File upload will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="min-w-32"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Package
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
