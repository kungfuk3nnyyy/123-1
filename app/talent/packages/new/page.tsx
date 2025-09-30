
'use client'

import { useState } from 'react'
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
  EyeOff
} from 'lucide-react'
import { useZodForm } from '@/hooks/useZodForm'
import { packageSchema, type PackageFormData } from '@/lib/validation/schemas'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { FormSubmitButton } from '@/components/ui/form-submit-button'

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

export default function CreatePackagePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting }
  } = useZodForm(packageSchema, {
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: 100,
      duration: 1,
      location: '',
      requirements: '',
      tags: [],
      isActive: true
    }
  })

  const [features, setFeatures] = useState<string[]>([''])
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [priceIsHidden, setPriceIsHidden] = useState(false)

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const addFeature = () => {
    setFeatures(prev => [...prev, ''])
  }

  const removeFeature = (index: number) => {
    if (features.length > 1) {
      const newFeatures = features.filter((_, i) => i !== index)
      setFeatures(newFeatures)
    }
  }

  const onSubmit = async (data: PackageFormData) => {
    setLoading(true)
    
    try {
      // Filter out empty features
      const cleanedFeatures = features.filter(f => f.trim())
      
      if (cleanedFeatures.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'At least one feature is required',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }

      const packageData = {
        ...data,
        features: cleanedFeatures,
        coverImageUrl: coverImageUrl || undefined,
        priceIsHidden
      }
      
      const response = await fetch('/api/talent/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Package created successfully!'
        })
        router.push('/talent/packages')
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create package',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating package:', error)
      toast({
        title: 'Error',
        description: 'Failed to create package',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
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
                <Plus className="h-6 w-6 text-calm-dark-grey" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-calm-dark-grey">
                  Create New Package
                </h1>
                <p className="text-calm-dark-grey/80 mt-1">
                  Design a service package for your clients
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-8">
            {/* Basic Information */}
            <Card className="border-2 border-calm-soft-blue/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-calm-dark-grey">
                  <Package className="h-5 w-5 text-calm-warm-beige" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Provide the essential details about your service package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  label="Package Title"
                  error={errors.title}
                  required
                >
                  <Input
                    {...register('title')}
                    placeholder="e.g., Wedding Photography Premium Package"
                  />
                </FormField>

                <FormField
                  label="Description"
                  error={errors.description}
                  required
                >
                  <Textarea
                    {...register('description')}
                    placeholder="Describe what's included in this package and what makes it special..."
                    rows={4}
                  />
                </FormField>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="Category"
                    error={errors.category}
                    required
                  >
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger>
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
                  </FormField>

                  <FormField
                    label="Location Served"
                    error={errors.location}
                  >
                    <Select onValueChange={(value) => setValue('location', value)}>
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
                  </FormField>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    label="Price (KES)"
                    error={errors.price}
                    required
                  >
                    <div className="space-y-4">
                      <Input
                        {...register('price', { valueAsNumber: true })}
                        type="number"
                        placeholder="50000"
                        min="100"
                        step="100"
                      />
                      
                      <div className="flex items-center space-x-3 pt-3 border-t border-calm-soft-blue/20">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="priceIsHidden"
                            checked={priceIsHidden}
                            onCheckedChange={setPriceIsHidden}
                          />
                          <Label htmlFor="priceIsHidden" className="text-sm font-medium flex items-center gap-2">
                            <EyeOff className="h-4 w-4 text-calm-warm-beige" />
                            Hide Price
                          </Label>
                        </div>
                      </div>
                      <p className="text-xs text-calm-dark-grey/60">
                        Display price as "On Inquiry" and require clients to request a custom quote
                      </p>
                    </div>
                  </FormField>

                  <FormField
                    label="Duration (Hours)"
                    error={errors.duration}
                    required
                  >
                    <Input
                      {...register('duration', { valueAsNumber: true })}
                      type="number"
                      placeholder="4"
                      min="1"
                      max="24"
                      step="0.5"
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card className="border-2 border-calm-soft-blue/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-calm-dark-grey">
                  <Package className="h-5 w-5 text-calm-warm-beige" />
                  Additional Details
                </CardTitle>
                <CardDescription>
                  Provide more information about your package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  label="Requirements"
                  error={errors.requirements}
                  description="Any special requirements or conditions for this package"
                >
                  <Textarea
                    {...register('requirements')}
                    placeholder="e.g., Client must provide venue access 2 hours before event..."
                    rows={3}
                  />
                </FormField>

                <FormField
                  label="Tags"
                  error={errors.tags}
                  required
                  description="Add tags to help clients find your package (press Enter to add each tag)"
                >
                  <Input
                    placeholder="e.g., wedding, photography, professional"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const value = e.currentTarget.value.trim()
                        if (value) {
                          const currentTags = watch('tags') || []
                          if (!currentTags.includes(value)) {
                            setValue('tags', [...currentTags, value])
                          }
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(watch('tags') || []).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-calm-soft-blue/10 text-calm-dark-grey rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const currentTags = watch('tags') || []
                            setValue('tags', currentTags.filter((_, i) => i !== index))
                          }}
                          className="text-calm-dark-grey/60 hover:text-calm-dark-grey"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </FormField>
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
                  List what's included in this package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Feature ${index + 1} (e.g., High-resolution photos)`}
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1"
                    />
                    {features.length > 1 && (
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
                
                {features.filter(f => f.trim()).length === 0 && (
                  <p className="text-sm text-red-600">At least one feature is required</p>
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
                  Add a cover image to make your package more attractive (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Image URL"
                  description="For now, please provide a direct URL to your image. File upload will be available soon."
                >
                  <Input
                    type="url"
                    placeholder="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjXiYEKFAxzcUiMVuW52RzWGJR_EX_pQG2dazJ5bYzUqkXKW8WrT3IDrBas1tVljimGmbZLXNGmhZhB-xRi6kX8c6hZvoqekmliyJZd7ignbdL4JFQOMyJCaMx1K73QnyknaXCkl-L0xz26/s1600/opera11ValidatesUrlOnSubmit.png"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading || isSubmitting}
              >
                Cancel
              </Button>
              <FormSubmitButton
                isSubmitting={isSubmitting || loading}
                isValid={isValid && features.filter(f => f.trim()).length > 0}
                className="min-w-32"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Package
                  </>
                )}
              </FormSubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
