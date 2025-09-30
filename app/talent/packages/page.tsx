
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Search,
  Filter,
  Package,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  Loader2,
  Camera,
  Music,
  Mic,
  Palette,
  Video,
  Sparkles,
  Copy,
  BarChart3,
  MessageSquare,
  Users
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'
import { Package as PackageType } from '@prisma/client'

const CATEGORIES = [
  { value: 'photography', label: 'Photography', icon: Camera },
  { value: 'dj', label: 'DJ Services', icon: Mic },
  { value: 'music', label: 'Live Music', icon: Music },
  { value: 'videography', label: 'Videography', icon: Video },
  { value: 'art', label: 'Art & Design', icon: Palette },
]

interface PaginationData {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function TalentPackagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [packages, setPackages] = useState<PackageType[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('all')
  const [publishingStates, setPublishingStates] = useState<{[key: string]: boolean}>({})

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
        limit: '10',
        search: searchTerm
      })

      if (publishedFilter !== 'all') {
        params.set('published', publishedFilter)
      }

      const response = await fetch(`/api/talent/packages?${params}`)
      const result = await response.json()

      if (result.success) {
        setPackages(result.data.packages)
        setPagination(result.data.pagination)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch packages',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching Package:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch packages',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchPackages(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPublishedFilter('all')
    fetchPackages(1)
  }

  const handleTogglePublish = async (packageId: string, currentStatus: boolean) => {
    // Set loading state for this specific package
    setPublishingStates(prev => ({ ...prev, [packageId]: true }))
    
    try {
      const response = await fetch(`/api/talent/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update the package in state
        setPackages(prev => prev.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, isPublished: !currentStatus }
            : pkg
        ))
        
        toast({
          title: 'Success',
          description: `Package ${!currentStatus ? 'published' : 'unpublished'} successfully`
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update package status',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating package:', error)
      toast({
        title: 'Error',
        description: 'Failed to update package status',
        variant: 'destructive'
      })
    } finally {
      setPublishingStates(prev => ({ ...prev, [packageId]: false }))
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    try {
      const response = await fetch(`/api/talent/packages/${packageId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Remove package from state
        setPackages(prev => prev.filter(pkg => pkg.id !== packageId))
        toast({
          title: 'Success',
          description: 'Package deleted successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete package',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting package:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete package',
        variant: 'destructive'
      })
    }
  }

  const handleDuplicatePackage = async (packageId: string, packageTitle: string) => {
    try {
      const response = await fetch(`/api/talent/packages/${packageId}/duplicate`, {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: `Package "${packageTitle}" duplicated successfully as draft`
        })
        // Refresh the packages list to show the new duplicate
        fetchPackages(pagination.currentPage)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to duplicate package',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error duplicating package:', error)
      toast({
        title: 'Error',
        description: 'Failed to duplicate package',
        variant: 'destructive'
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchPackages(newPage)
  }

  // Load packages on component mount
  useEffect(() => {
    fetchPackages(1)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-white via-calm-light-grey to-calm-soft-blue/20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-calm-white to-calm-light-grey border-b-2 border-calm-soft-blue/30 shadow-brand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-calm-warm-beige to-calm-soft-blue rounded-xl flex items-center justify-center shadow-brand-lg mr-4">
                <Package className="h-6 w-6 text-calm-dark-grey" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-calm-dark-grey">
                  Manage Your Packages
                </h1>
                <p className="text-calm-dark-grey/80 mt-1">
                  Create and manage your service packages
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/talent/packages/new')}
              variant="primary"
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create New Package
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8 hover-glow border-2 border-calm-soft-blue/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-calm-warm-beige" />
                <h2 className="text-lg font-semibold text-calm-dark-grey">Filter & Search</h2>
              </div>
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-calm-warm-beige" />
                    <Input
                      placeholder="Search packages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                
                <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    <SelectItem value="true">Published Only</SelectItem>
                    <SelectItem value="false">Draft Only</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button onClick={handleSearch} variant="primary">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-8 bg-white rounded-xl p-6 shadow-brand border-2 border-calm-soft-blue/30">
          <div>
            {loading ? (
              <span className="flex items-center gap-3 text-calm-dark-grey/80">
                <Loader2 className="h-5 w-5 animate-spin text-calm-warm-beige" />
                <span className="font-medium">Loading packages...</span>
              </span>
            ) : (
              <div>
                <p className="text-xl font-bold text-calm-dark-grey">
                  {pagination.totalCount} Package{pagination.totalCount !== 1 ? 's' : ''}
                </p>
                <p className="text-calm-dark-grey/80">Total packages created</p>
              </div>
            )}
          </div>
        </div>

        {/* Package Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : packages.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const CategoryIcon = getCategoryIcon(pkg.category)
              const isPublishing = publishingStates[pkg.id] || false
              
              return (
                <Card key={pkg.id} className="group hover-lift border-2 border-calm-soft-blue/30 hover:border-calm-warm-beige/50 bg-white overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-calm-light-grey rounded-lg">
                          <CategoryIcon className="h-6 w-6 text-calm-warm-beige" />
                        </div>
                        <div>
                          <Badge 
                            variant={pkg.isPublished ? "default" : "secondary"}
                            className={pkg.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {pkg.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl group-hover:text-calm-warm-beige transition-colors line-clamp-2">
                      {pkg.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-calm-dark-grey/70">
                      {pkg.category}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-calm-dark-grey/80 text-sm line-clamp-3">
                      {pkg.description}
                    </p>

                    {/* Package Details */}
                    <div className="space-y-2">
                      {pkg.location && (
                        <div className="flex items-center text-sm text-calm-dark-grey/70">
                          <MapPin className="h-4 w-4 mr-2" />
                          {pkg.location}
                        </div>
                      )}
                      {pkg.duration && (
                        <div className="flex items-center text-sm text-calm-dark-grey/70">
                          <Clock className="h-4 w-4 mr-2" />
                          {pkg.duration}
                        </div>
                      )}
                    </div>

                    {/* Analytics Section */}
                    <div className="bg-calm-light-grey/30 p-3 rounded-lg border border-calm-soft-blue/20">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-calm-warm-beige" />
                        <h4 className="text-sm font-medium text-calm-dark-grey">Package Performance</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-calm-soft-blue">
                            <Eye className="h-3 w-3" />
                            <span className="font-semibold">{pkg.viewCount || 0}</span>
                          </div>
                          <p className="text-calm-dark-grey/60">Views</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-calm-warm-beige">
                            <MessageSquare className="h-3 w-3" />
                            <span className="font-semibold">{pkg.inquiryCount || 0}</span>
                          </div>
                          <p className="text-calm-dark-grey/60">Inquiries</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <Users className="h-3 w-3" />
                            <span className="font-semibold">{pkg.bookingCount || 0}</span>
                          </div>
                          <p className="text-calm-dark-grey/60">Bookings</p>
                        </div>
                      </div>
                      {pkg.viewCount > 0 && (
                        <div className="mt-2 pt-2 border-t border-calm-soft-blue/20">
                          <p className="text-xs text-calm-dark-grey/70 text-center">
                            {pkg.inquiryCount > 0 
                              ? `${((pkg.inquiryCount / pkg.viewCount) * 100).toFixed(1)}% inquiry rate`
                              : 'No inquiries yet'
                            }
                            {pkg.bookingCount > 0 && pkg.inquiryCount > 0
                              ? ` • ${((pkg.bookingCount / pkg.inquiryCount) * 100).toFixed(1)}% conversion rate`
                              : ''
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Features Preview */}
                    {pkg.features.length > 0 && (
                      <div className="bg-calm-light-grey/50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-calm-dark-grey mb-2 flex items-center">
                          <Sparkles className="h-4 w-4 mr-1 text-calm-warm-beige" />
                          Features
                        </h4>
                        <div className="text-sm text-calm-dark-grey/80">
                          {pkg.features.slice(0, 2).map((feature, index) => (
                            <div key={index} className="flex items-start">
                              <div className="w-1.5 h-1.5 bg-calm-warm-beige rounded-full mr-2 flex-shrink-0 mt-1.5"></div>
                              <span>{feature}</span>
                            </div>
                          ))}
                          {pkg.features.length > 2 && (
                            <p className="text-xs text-calm-dark-grey/60 mt-1">
                              +{pkg.features.length - 2} more features
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-calm-soft-blue/30">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-calm-danger">{formatCurrency(Number(pkg.price))}</p>
                        <p className="text-xs text-calm-dark-grey/60">Starting price</p>
                      </div>
                    </div>

                    {/* Publish Toggle */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        {pkg.isPublished ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium text-calm-dark-grey">
                          {pkg.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <Switch
                        checked={pkg.isPublished}
                        onCheckedChange={() => handleTogglePublish(pkg.id, pkg.isPublished)}
                        disabled={isPublishing}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push(`/talent/packages/${pkg.id}/edit`)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => handleDuplicatePackage(pkg.id, pkg.title)}
                        className="text-calm-warm-beige hover:text-calm-warm-beige/80 hover:bg-calm-warm-beige/10 border-calm-warm-beige/30"
                        title="Duplicate this package"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Package</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{pkg.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePackage(pkg.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <EmptyState
            icon={EMPTY_STATES.TALENT_PACKAGES.icon}
            title={EMPTY_STATES.TALENT_PACKAGES.title}
            description={EMPTY_STATES.TALENT_PACKAGES.description}
            size="lg"
            action={{
              label: 'Create Your First Package',
              onClick: () => router.push('/talent/packages/new')
            }}
          />
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
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
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
