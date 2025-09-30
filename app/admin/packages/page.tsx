
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Package, 
  Search, 
  Filter,
  RefreshCw,
  Download,
  Eye,
  Star,
  Users,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react'

interface PackageItem {
  id: string
  title: string
  description: string
  category: string
  location?: string
  price: number
  duration?: string
  features: string[]
  coverImageUrl?: string
  isPublished: boolean
  isActive: boolean
  viewCount: number
  bookingCount: number
  createdAt: string
  talent: {
    id: string
    name: string
    email: string
    verificationStatus: string
    category?: string
  }
}

interface PackageStats {
  totalPackages: number
  publishedPackages: number
  unpublishedPackages: number
  inactivePackages: number
  categoryCounts: Record<string, number>
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export default function PackageManagementPage() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [stats, setStats] = useState<PackageStats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; package: PackageItem | null }>({
    open: false,
    action: '',
    package: null
  })

  const handleExportData = () => {
    if (!packages.length) return
    
    // Create CSV content
    const headers = [
      'Package ID', 'Title', 'Category', 'Talent Name', 'Talent Email', 
      'Price', 'Duration', 'Published', 'Active', 'Views', 'Bookings', 'Created At'
    ]
    const csvContent = [
      headers.join(','),
      ...packages.map(pkg => [
        pkg.id,
        `"${pkg.title}"`,
        pkg.category,
        `"${pkg.talent.name}"`,
        pkg.talent.email,
        pkg.price,
        pkg.duration || 'N/A',
        pkg.isPublished ? 'Yes' : 'No',
        pkg.isActive ? 'Yes' : 'No',
        pkg.viewCount,
        pkg.bookingCount,
        new Date(pkg.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `packages-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const fetchPackages = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        category: categoryFilter,
        page: page.toString(),
        limit: '12'
      })

      const response = await fetch(`/api/admin/packages?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPackages(data.packages || [])
        setStats(data.stats)
        setPagination(data.pagination)
      } else {
        toast.error('Failed to fetch packages')
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Error loading packages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages(currentPage)
  }, [search, statusFilter, categoryFilter, currentPage])

  const handlePackageAction = async (action: string, pkg: PackageItem) => {
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, action })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchPackages(currentPage)
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (error) {
      console.error('Error updating package:', error)
      toast.error('Error updating package')
    }
    
    setActionDialog({ open: false, action: '', package: null })
  }

  const getStatusBadge = (pkg: PackageItem) => {
    if (!pkg.isActive) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    } else if (pkg.isPublished) {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unverified</Badge>
    }
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setCategoryFilter('ALL')
    setCurrentPage(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const getTopCategories = () => {
    if (!stats?.categoryCounts) return []
    return Object.entries(stats.categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">Package Management</h1>
          <p className="text-calm-dark-grey/80 mt-2">Moderate and manage talent service packages</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchPackages(currentPage)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-calm-dark-grey/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPackages?.toLocaleString() || 0}</div>
            <p className="text-xs text-calm-dark-grey/60">All platform packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.publishedPackages || 0}</div>
            <p className="text-xs text-green-600">
              {stats?.totalPackages ? Math.round((stats.publishedPackages / stats.totalPackages) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft/Unpublished</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unpublishedPackages || 0}</div>
            <p className="text-xs text-yellow-600">Awaiting publication</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inactivePackages || 0}</div>
            <p className="text-xs text-red-600">Disabled packages</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Categories */}
      {stats?.categoryCounts && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Categories</CardTitle>
            <CardDescription>Top categories by package count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getTopCategories().map(([category, count]) => (
                <Badge key={category} variant="outline" className="px-3 py-1">
                  {category} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Packages</CardTitle>
          <CardDescription>Find and manage service packages with advanced filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search by title, description, or talent..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="unpublished">Unpublished</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="Photography">Photography</SelectItem>
                <SelectItem value="DJ/Music">DJ/Music</SelectItem>
                <SelectItem value="Catering">Catering</SelectItem>
                <SelectItem value="Decoration">Decoration</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
          <CardDescription>
            Complete list of service packages 
            {pagination && ` (${pagination.total} total, page ${pagination.page} of ${pagination.pages})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-calm-dark-grey/80">Loading packages...</span>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No packages found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative bg-gray-200">
                    {pkg.coverImageUrl ? (
                      <Image
                        src={pkg.coverImageUrl}
                        alt={pkg.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(pkg)}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{pkg.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{pkg.category}</Badge>
                        <span className="font-bold text-lg">{formatCurrency(pkg.price)}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {pkg.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {pkg.bookingCount}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Created by:</span>
                          {getVerificationBadge(pkg.talent.verificationStatus)}
                        </div>
                        <p className="text-sm text-gray-600">{pkg.talent.name}</p>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => window.open(`/packages/${pkg.id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        
                        {pkg.isPublished ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setActionDialog({ 
                              open: true, 
                              action: 'unpublish', 
                              package: pkg 
                            })}
                          >
                            <PauseCircle className="h-3 w-3 mr-1" />
                            Unpublish
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => setActionDialog({ 
                              open: true, 
                              action: 'publish', 
                              package: pkg 
                            })}
                          >
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Publish
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActionDialog({ 
                            open: true, 
                            action: pkg.isActive ? 'deactivate' : 'activate', 
                            package: pkg 
                          })}
                        >
                          {pkg.isActive ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-calm-dark-grey/80">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} packages
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {actionDialog.action === 'publish' ? 'Publication' : 
                      actionDialog.action === 'unpublish' ? 'Unpublication' :
                      actionDialog.action === 'activate' ? 'Activation' : 'Deactivation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.action} the package{' '}
              <strong>"{actionDialog.package?.title}"</strong>? 
              {actionDialog.action === 'publish' && ' This will make it visible to all users.'}
              {actionDialog.action === 'unpublish' && ' This will hide it from public view.'}
              {actionDialog.action === 'deactivate' && ' This will completely disable the package.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionDialog.package && handlePackageAction(actionDialog.action, actionDialog.package)}
              className={actionDialog.action === 'deactivate' ? 'bg-red-600 hover:bg-red-700' : 
                         actionDialog.action === 'publish' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actionDialog.action === 'publish' ? 'Publish Package' : 
               actionDialog.action === 'unpublish' ? 'Unpublish Package' :
               actionDialog.action === 'activate' ? 'Activate Package' : 'Deactivate Package'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
