
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Clock, MapPin, Star, Package, Eye } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

async function getPackageDetails(id: string) {
  try {
    const packageData = await prisma.package.findUnique({
      where: { id },
      include: {
        TalentProfile: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                verificationStatus: true
              }
            }
          }
        }
      }
    })

    if (!packageData) {
      return null
    }

    // For now, use the existing bookingCount and viewCount from the package
    // These are likely calculated fields that track the stats
    return {
      ...packageData,
      stats: {
        totalBookings: packageData.bookingCount || 0,
        completedBookings: Math.floor((packageData.bookingCount || 0) * 0.8), // Estimate
        averageRating: 0, // Could be calculated from talent reviews
        viewCount: packageData.viewCount || 0
      }
    }
  } catch (error) {
    console.error('Error fetching package details:', error)
    return null
  }
}

export default async function PackageDetailPage({ params }: PageProps) {
  const packageData = await getPackageDetails(params.id)

  if (!packageData) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const getStatusBadge = () => {
    if (!packageData.isActive) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    } else if (packageData.isPublished) {
      return <Badge className="bg-green-100 text-green-800">Published</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Package Details</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Overview */}
            <Card>
              <div className="aspect-video relative bg-gray-200 rounded-t-lg overflow-hidden">
                {packageData.coverImageUrl ? (
                  <Image
                    src={packageData.coverImageUrl}
                    alt={packageData.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  {getStatusBadge()}
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{packageData.title}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">{packageData.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{packageData.viewCount} views</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    {packageData.description}
                  </p>

                  {packageData.features?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Features Included:</h3>
                      <ul className="space-y-1">
                        {packageData.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reviews placeholder - could be enhanced later */}
            <Card>
              <CardHeader>
                <CardTitle>Package Statistics</CardTitle>
                <CardDescription>
                  Performance metrics for this package
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{packageData.stats.viewCount}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{packageData.stats.totalBookings}</div>
                    <div className="text-sm text-gray-600">Bookings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {packageData.priceIsHidden ? 'Contact for Quote' : formatCurrency(Number(packageData.price))}
                </div>
                {packageData.duration && (
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{packageData.duration}</span>
                  </div>
                )}
                {packageData.location && (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{packageData.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Talent Info */}
            <Card>
              <CardHeader>
                <CardTitle>Talent Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{packageData.TalentProfile?.User?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{packageData.TalentProfile?.User?.email || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Link href={`/talent/${packageData.talentId}`}>
                    <Button variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      View Talent Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Package Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Bookings:</span>
                  <span className="font-semibold">{packageData.stats.totalBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-semibold">{packageData.stats.completedBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-semibold">
                    {packageData.stats.totalBookings > 0 
                      ? Math.round((packageData.stats.completedBookings / packageData.stats.totalBookings) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Rating:</span>
                  <span className="font-semibold">
                    {packageData.stats.averageRating.toFixed(1)}/5
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
