
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Eye,
  Download,
  ExternalLink,
  MessageSquare,
  Package,
  Image as ImageIcon,
  User,
  FileText,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Globe,
  Shield,
  Clock,
  Users,
  Phone,
  Mail,
  Edit,
  LogIn,
  Search,
  UserPlus
} from 'lucide-react'

interface TalentProfile {
  id: string
  userId: string
  username?: string | null
  name: string
  bio?: string | null
  tagline?: string | null
  location?: string | null
  website?: string | null
  category?: string | null
  skills: string[]
  experience?: string | null
  hourlyRate?: number | null
  availability?: string | null
  averageRating: number
  totalReviews: number
  totalBookings: number
  profileViews: number
  socialLinks?: Record<string, string> | null
  epkUrl?: string | null
  pastClients: string[]
  verified: boolean
  memberSince?: string
  image?: string | null
  portfolioItems: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    url: string
    createdAt: string
  }>
  packages: Array<{
    id: string
    title: string
    description: string
    category: string
    location?: string | null
    price: number
    priceIsHidden?: boolean
    duration?: string | null
    features: string[]
    coverImageUrl?: string | null
    images: string[]
    viewCount: number
    inquiryCount: number
    bookingCount: number
    createdAt: string
    updatedAt: string
  }>
  reviews: Array<{
    id: string
    rating: number
    comment: string
    reviewerType: string
    createdAt: string
    reviewer: {
      name: string
      image?: string | null
    }
    booking: {
      id: string
      date: string
    }
  }>
}

interface TalentProfileViewProps {
  profile: TalentProfile
}

export function TalentProfileView({ profile }: TalentProfileViewProps) {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('packages')
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  
  // Determine user type and permissions
  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const currentUserId = session?.user?.id
  const currentUserRole = session?.user?.role
  const isProfileOwner = isAuthenticated && currentUserId === profile.userId
  const isOrganizer = currentUserRole === 'ORGANIZER'
  const isTalent = currentUserRole === 'TALENT'

  const socialPlatforms = [
    { key: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-600' },
    { key: 'youtube', icon: Youtube, label: 'YouTube', color: 'text-red-600' },
    { key: 'twitter', icon: Twitter, label: 'Twitter/X', color: 'text-blue-500' },
    { key: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-600' }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-red-100 text-red-800'
      case 'partially available': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Public Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 text-gray-800">
                <div className="rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl h-8 w-8 bg-gradient-to-br from-blue-600 to-gray-800">
                  <div className="h-1/2 w-1/2 text-white font-bold text-sm">GS</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-bold text-xl text-gray-800">
                    Gig<span className="text-blue-600">Secure</span>
                  </div>
                </div>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/explore-packages" className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                <Search className="h-4 w-4" />
                <span>Explore Packages</span>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Link href="/auth/login" className="hidden sm:flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-50">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link href="/auth/signup" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md transition-all">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Get Started
                </Link>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Profile Views: {profile.profileViews?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Back to Browse
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-8 md:p-12 text-white"
            >
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative">
                    <div className="relative w-24 h-24 md:w-32 md:h-32">
                      <Image
                        src={profile.image || '/api/placeholder/150/150'}
                        alt={profile.name}
                        fill
                        className="rounded-2xl object-cover border-4 border-white/20"
                        priority
                      />
                    </div>
                    {profile.verified && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 p-1.5 rounded-full">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h1 className="text-3xl md:text-4xl font-bold">{profile.name}</h1>
                      {profile.verified && (
                        <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {profile.tagline && (
                      <p className="text-xl text-blue-100 mb-4">{profile.tagline}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-6 text-blue-100">
                      {profile.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.location}
                        </div>
                      )}
                      
                      {profile.category && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {profile.category}
                        </div>
                      )}
                      
                      {profile.availability && (
                        <Badge className={getAvailabilityColor(profile.availability)}>
                          <Clock className="h-3 w-3 mr-1" />
                          {profile.availability}
                        </Badge>
                      )}
                      
                      {profile.memberSince && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Member since {formatDate(profile.memberSince)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(profile.averageRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{profile.averageRating.toFixed(1)}</span>
                        <span className="text-blue-200">
                          ({profile.totalReviews} reviews)
                        </span>
                      </div>
                      
                      <div className="text-blue-200">
                        {profile.totalBookings} completed projects
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabbed Content */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start p-0 h-auto bg-transparent border-b rounded-none">
                  <TabsTrigger 
                    value="packages" 
                    className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Packages ({profile.packages.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="portfolio" 
                    className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Portfolio ({profile.portfolioItems.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Reviews ({profile.reviews.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="about" 
                    className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
                  >
                    <User className="h-4 w-4 mr-2" />
                    About
                  </TabsTrigger>
                </TabsList>

                {/* Packages Tab */}
                <TabsContent value="packages" className="p-6">
                  {profile.packages.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {profile.packages.map((pkg) => (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -2, shadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                          className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                        >
                          {pkg.coverImageUrl && (
                            <div className="relative h-48">
                              <Image
                                src={pkg.coverImageUrl}
                                alt={pkg.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-lg text-gray-900">{pkg.title}</h3>
                              {!pkg.priceIsHidden && (
                                <div className="text-right">
                                  <div className="font-bold text-xl text-blue-600">
                                    {formatCurrency(pkg.price)}
                                  </div>
                                  {pkg.duration && (
                                    <div className="text-sm text-gray-500">{pkg.duration}</div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
                            
                            {pkg.features.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium text-sm text-gray-800 mb-2">Includes:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {pkg.features.slice(0, 3).map((feature, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {pkg.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{pkg.features.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span><Eye className="h-3 w-3 inline mr-1" />{pkg.viewCount}</span>
                                <span><Users className="h-3 w-3 inline mr-1" />{pkg.bookingCount}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                                {isProfileOwner ? (
                                  <Button size="sm" variant="outline" asChild>
                                    <Link href={`/talent/packages/${pkg.id}/edit`}>
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Link>
                                  </Button>
                                ) : isAuthenticated ? (
                                  <Button size="sm">
                                    Book Package
                                  </Button>
                                ) : (
                                  <Button size="sm" asChild>
                                    <Link href="/auth/signup">
                                      Book Package
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No packages available</h3>
                      <p className="text-gray-500">This talent hasn't created any packages yet.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Portfolio Tab */}
                <TabsContent value="portfolio" className="p-6">
                  {profile.portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {profile.portfolioItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <Image
                            src={item.url}
                            alt={item.originalName}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio items</h3>
                      <p className="text-gray-500">This talent hasn't uploaded any portfolio items yet.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews" className="p-6">
                  {profile.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {profile.reviews.map((review) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg p-6"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative w-10 h-10">
                              <Image
                                src={review.reviewer.image || '/api/placeholder/40/40'}
                                alt={review.reviewer.name}
                                fill
                                className="rounded-full object-cover"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-gray-900">{review.reviewer.name}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                      <p className="text-gray-500">This talent hasn't received any reviews yet.</p>
                    </div>
                  )}
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="p-6">
                  <div className="space-y-8">
                    {/* Bio Section */}
                    {profile.bio && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4">About {profile.name}</h3>
                        <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    {/* Skills Section */}
                    {profile.skills.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Skills & Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="px-3 py-1">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience & Rate */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {profile.experience && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Experience Level</h3>
                          <p className="text-gray-700">{profile.experience}</p>
                        </div>
                      )}
                      
                      {profile.hourlyRate && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Hourly Rate</h3>
                          <p className="text-gray-700">{formatCurrency(profile.hourlyRate)}/hour</p>
                        </div>
                      )}
                    </div>

                    {/* Past Clients */}
                    {profile.pastClients.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Notable Past Clients & Events</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.pastClients.map((client) => (
                            <Badge key={client} variant="outline" className="px-3 py-2">
                              <Users className="h-3 w-3 mr-2" />
                              {client}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Action Card */}
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Show different actions based on user type */}
                  {isProfileOwner ? (
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/talent/profile">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  ) : isAuthenticated ? (
                    <Button className="w-full" size="lg">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Request to Book
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button className="w-full" size="lg" asChild>
                        <Link href="/auth/signup">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request to Book
                        </Link>
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Sign up to contact this talent
                      </p>
                    </div>
                  )}
                  
                  {profile.epkUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={profile.epkUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download EPK
                      </a>
                    </Button>
                  )}

                  {profile.website && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                </div>
              </Card>

              {/* Social Media Links */}
              {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Follow on Social Media</h3>
                  <div className="space-y-3">
                    {socialPlatforms.map((platform) => {
                      const url = profile.socialLinks?.[platform.key]
                      if (!url) return null
                      
                      return (
                        <a
                          key={platform.key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <platform.icon className={`h-5 w-5 ${platform.color}`} />
                          <span className="text-sm font-medium">{platform.label}</span>
                          <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                        </a>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="font-medium">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projects Completed</span>
                    <span className="font-medium">{profile.totalBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profile Views</span>
                    <span className="font-medium">{profile.profileViews?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Repeat Clients</span>
                    <span className="font-medium">78%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
