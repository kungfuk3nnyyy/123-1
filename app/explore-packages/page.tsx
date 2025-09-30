
'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { BookingModal } from '@/components/booking-modal'
import { PublicHeader } from '@/components/public-header'
import { 
  Search, 
  MapPin, 
  Star, 
  Clock,
  Package,
  Camera,
  Music,
  Mic,
  Palette,
  Video,
  Sparkles,
  Shield,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  X,
  MessageSquare,
  ShoppingCart
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'

interface ServicePackage {
  id: string
  title: string
  category: string
  description: string
  price: number
  priceIsHidden?: boolean
  duration: string
  features: string[]
  rating: number
  reviews: number
  provider: {
    id: string
    name: string
    location: string
    verified: boolean
    skills: string[]
    bio: string
  }
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const CATEGORIES = [
  { value: 'photography', label: 'Photography', icon: Camera },
  { value: 'dj', label: 'DJ Services', icon: Mic },
  { value: 'music', label: 'Live Music', icon: Music },
  { value: 'videography', label: 'Videography', icon: Video },
  { value: 'art', label: 'Art & Design', icon: Palette },
]

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 
  'Garissa', 'Kakamega', 'Meru', 'Nyeri', 'Machakos', 'Kericho', 'Embu'
]

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
]

function ExplorePackagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState(searchParams?.get('location') || '')
  const [priceRange, setPriceRange] = useState<number[]>([0, 200000])
  const [minRating, setMinRating] = useState<number>(0)
  const [sortBy, setSortBy] = useState('recommended')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.label.toLowerCase().includes(category.toLowerCase()))
    return cat?.icon || Package
  }

  const fetchPackages = async (page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search: searchTerm,
        location: locationFilter,
      })

      // Handle category filter (multi-select)
      if (selectedCategories.length > 0) {
        params.set('category', selectedCategories.join(','))
      }

      // Handle price range
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString())
      if (priceRange[1] < 200000) params.set('maxPrice', priceRange[1].toString())

      // Handle sorting
      switch (sortBy) {
        case 'price_low':
          params.set('sortBy', 'price')
          params.set('sortOrder', 'asc')
          break
        case 'price_high':
          params.set('sortBy', 'price')
          params.set('sortOrder', 'desc')
          break
        case 'rating':
          params.set('sortBy', 'rating')
          params.set('sortOrder', 'desc')
          break
        default: // recommended
          params.set('sortBy', 'rating')
          params.set('sortOrder', 'desc')
          break
      }

      const response = await fetch(`/api/packages?${params}`)
      const result = await response.json()

      if (result.success) {
        let filteredPackages = result.data.packages

        // Client-side rating filter
        if (minRating > 0) {
          filteredPackages = filteredPackages.filter((pkg: ServicePackage) => pkg.rating >= minRating)
        }

        setPackages(filteredPackages)
        setPagination(result.data.pagination)
      } else {
        console.error('Failed to fetch packages:', result.error)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryValue: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryValue])
    } else {
      setSelectedCategories(prev => prev.filter(cat => cat !== categoryValue))
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategories([])
    setLocationFilter('')
    setPriceRange([0, 200000])
    setMinRating(0)
    setSortBy('recommended')
    router.push('/explore-packages')
  }

  const applyFilters = () => {
    fetchPackages(1)
  }

  // Track package view
  const trackPackageView = async (packageId: string) => {
    try {
      await fetch(`/api/packages/${packageId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      // Silently handle view tracking errors - don't disrupt user experience
      console.debug('View tracking failed:', error)
    }
  }

  const handleBookPackage = (pkg: ServicePackage) => {
    setSelectedPackage(pkg)
    setIsBookingModalOpen(true)
  }

  const handleViewDetails = (pkg: ServicePackage) => {
    // Track the package view
    trackPackageView(pkg.id)
    
    // Future implementation: could navigate to a detailed package view page
    // For now, we'll just track the view
    console.log('Viewed package details:', pkg.id)
  }

  const handlePageChange = (newPage: number) => {
    fetchPackages(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Auto-apply filters when they change (debounced)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPackages(1)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedCategories, locationFilter, priceRange, minRating, sortBy])

  // Initial load on component mount - uses search params if present
  useEffect(() => {
    fetchPackages(1)
  }, []) // Empty dependency array - only run once on mount

  return (
    <div className="min-h-screen bg-white">
      {/* Public Navigation Header */}
      <PublicHeader />
      
      {/* Clean Header - Light Grey Background */}
      <div className="bg-[#F8F9FA] border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#212529] mb-4">
              Explore Event Packages
            </h1>
            <p className="text-lg text-[#6C757D] max-w-2xl mx-auto">
              Find and book the perfect service package for your next event in Kenya
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout: 25% sidebar + 75% main */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 25% Filtering Sidebar - Sticky */}
          <div className="w-1/4">
            <div className="sticky top-24">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-[#212529] flex items-center">
                    <Filter className="h-5 w-5 mr-2 text-[#A3B8CC]" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Keyword Search */}
                  <div>
                    <label className="text-sm font-medium text-[#212529] mb-2 block">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D]" />
                      <Input
                        placeholder="Package or talent name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-300 focus:border-[#A3B8CC] focus:ring-[#A3B8CC]"
                      />
                    </div>
                  </div>

                  {/* Category Multi-select */}
                  <div>
                    <label className="text-sm font-medium text-[#212529] mb-3 block">
                      Category
                    </label>
                    <div className="space-y-2">
                      {CATEGORIES.map((category) => (
                        <div key={category.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={category.value}
                            checked={selectedCategories.includes(category.value)}
                            onCheckedChange={(checked) => 
                              handleCategoryChange(category.value, checked as boolean)
                            }
                            className="data-[state=checked]:bg-[#A3B8CC] data-[state=checked]:border-[#A3B8CC]"
                          />
                          <label 
                            htmlFor={category.value}
                            className="text-sm text-[#212529] cursor-pointer flex items-center"
                          >
                            <category.icon className="h-4 w-4 mr-2 text-[#6C757D]" />
                            {category.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location Dropdown */}
                  <div>
                    <label className="text-sm font-medium text-[#212529] mb-2 block">
                      Location
                    </label>
                    <Select value={locationFilter || "all"} onValueChange={(value) => setLocationFilter(value === "all" ? "" : value)}>
                      <SelectTrigger className="border-gray-300 focus:border-[#A3B8CC]">
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {KENYAN_COUNTIES.map((county) => (
                          <SelectItem key={county.toLowerCase()} value={county.toLowerCase()}>
                            {county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Slider */}
                  <div>
                    <label className="text-sm font-medium text-[#212529] mb-2 block">
                      Price Range (KES)
                    </label>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={200000}
                        min={0}
                        step={5000}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-[#6C757D]">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Talent Rating */}
                  <div>
                    <label className="text-sm font-medium text-[#212529] mb-2 block">
                      Minimum Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                          className="flex items-center"
                        >
                          <Star 
                            className={`h-5 w-5 ${rating <= minRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                    {minRating > 0 && (
                      <p className="text-xs text-[#6C757D] mt-1">
                        {minRating}+ stars & up
                      </p>
                    )}
                  </div>

                  {/* Reset Filters */}
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full border-gray-300 text-[#6C757D] hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 75% Main Content Area */}
          <div className="w-3/4">
            {/* Sorting Dropdown */}
            <div className="flex justify-between items-center mb-6">
              <div>
                {loading ? (
                  <div className="flex items-center text-[#6C757D]">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading packages...</span>
                  </div>
                ) : (
                  <p className="text-[#212529] font-medium">
                    {pagination.totalCount} package{pagination.totalCount !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-[#6C757D]">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-gray-300 focus:border-[#A3B8CC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Package Grid */}
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="animate-pulse border border-gray-200">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                      <div className="flex justify-between">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : packages.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => {
                  const CategoryIcon = getCategoryIcon(pkg.category)
                  return (
                    <Card key={pkg.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white overflow-hidden">
                      {/* Package Cover Image Placeholder */}
                      <div className="h-48 bg-gradient-to-r from-[#F8F9FA] to-[#A3B8CC]/20 flex items-center justify-center">
                        <CategoryIcon className="h-16 w-16 text-[#A3B8CC]" />
                      </div>
                      
                      <CardContent className="p-6 space-y-4">
                        {/* Category Tag */}
                        <div className="flex items-center justify-between">
                          <Badge className="bg-[#A3B8CC] text-white hover:bg-[#A3B8CC]/90">
                            {pkg.category}
                          </Badge>
                          {pkg.provider.verified && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <Shield className="h-4 w-4" />
                              <span className="text-xs font-medium">Verified</span>
                            </div>
                          )}
                        </div>

                        {/* Package Title */}
                        <h3 className="text-lg font-bold text-[#212529] group-hover:text-[#A3B8CC] transition-colors line-clamp-2">
                          {pkg.title}
                        </h3>

                        {/* Talent Name & Location */}
                        <div className="flex items-center text-[#6C757D] text-sm">
                          <span className="font-medium">{pkg.provider.name}</span>
                          <span className="mx-2">•</span>
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{pkg.provider.location}</span>
                        </div>

                        {/* Features Preview */}
                        <div className="space-y-1">
                          {pkg.features.slice(0, 2).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-[#6C757D]">
                              <div className="w-1.5 h-1.5 bg-[#A3B8CC] rounded-full mr-2"></div>
                              <span>{feature}</span>
                            </div>
                          ))}
                          {pkg.features.length > 2 && (
                            <p className="text-xs text-[#6C757D] pl-3.5">
                              +{pkg.features.length - 2} more features
                            </p>
                          )}
                        </div>

                        {/* Rating and Price */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-[#212529]">
                              {pkg.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-[#6C757D]">({pkg.reviews})</span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#212529]">
                              {pkg.priceIsHidden ? 'Price on Inquiry' : formatCurrency(pkg.price)}
                            </p>
                          </div>
                        </div>

                        {/* Dual CTA Buttons */}
                        <div className="flex gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewDetails(pkg)}
                            className="flex-1 border-[#A3B8CC] text-[#A3B8CC] hover:bg-[#A3B8CC] hover:text-white"
                          >
                            View Details
                          </Button>
                          <Button 
                            onClick={() => handleBookPackage(pkg)}
                            className="flex-1 bg-[#212529] hover:bg-[#212529]/90 text-white"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Request to Book
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              /* No Results Found */
              <EmptyState
                icon={searchTerm || selectedCategories.length > 0 || locationFilter || minRating > 0 ? 
                  EMPTY_STATES.PACKAGES_SEARCH.icon : EMPTY_STATES.PACKAGES_GENERAL.icon}
                title={searchTerm || selectedCategories.length > 0 || locationFilter || minRating > 0 ? 
                  EMPTY_STATES.PACKAGES_SEARCH.title : EMPTY_STATES.PACKAGES_GENERAL.title}
                description={searchTerm || selectedCategories.length > 0 || locationFilter || minRating > 0 ? 
                  EMPTY_STATES.PACKAGES_SEARCH.description : EMPTY_STATES.PACKAGES_GENERAL.description}
                size="lg"
                action={{
                  label: 'Reset All Filters',
                  onClick: clearFilters,
                  variant: 'outline'
                }}
              />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="border-gray-300 text-[#6C757D] hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                    const pageNumber = Math.max(1, pagination.currentPage - 2) + index
                    if (pageNumber > pagination.totalPages) return null
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className={
                          pageNumber === pagination.currentPage 
                            ? "bg-[#A3B8CC] hover:bg-[#A3B8CC]/90 text-white" 
                            : "border-gray-300 text-[#6C757D] hover:bg-gray-50"
                        }
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="border-gray-300 text-[#6C757D] hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedPackage && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false)
            setSelectedPackage(null)
          }}
          packageData={selectedPackage}
        />
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="bg-[#F8F9FA] border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#212529] mb-4">
              Explore Event Packages
            </h1>
            <p className="text-lg text-[#6C757D] max-w-2xl mx-auto">
              Find and book the perfect service package for your next event in Kenya
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#A3B8CC]" />
        </div>
      </div>
    </div>
  )
}

export default function ExplorePackagesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExplorePackagesContent />
    </Suspense>
  )
}
