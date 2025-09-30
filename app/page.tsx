
'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Shield, 
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Camera,
  Music,
  Mic,
  Users,
  MessageSquare,
  UserPlus,
  Eye,
  CheckCircle,
  ArrowRight,
  Heart,
  Handshake,
  Sparkles,
  Play,
  Filter,
  Package,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Award,
  ShoppingCart,
  Building2,
  Briefcase,
  Globe,
  Headphones,
  Coffee,
  Utensils,
  Palette,
  Video,
  Calendar,
  DollarSign,
  ThumbsUp,
  UserCheck,
  CheckCircle2 as Verified
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'
import Image from 'next/image'

// Interfaces
interface TopTalent {
  id: string
  name: string
  category: string
  skills: string[]
  rating: number
  reviews: number
  location: string
  verified: boolean
  image: string
  hourlyRate: number | null
}

interface Package {
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
  }
}

interface Event {
  id: string
  title: string
  category: string
  description: string
  date: string
  location: string
  price: number
  attendees: number
  maxAttendees: number
  organizer: {
    id: string
    name: string
    verified: boolean
  }
}

function HomePageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topTalents, setTopTalents] = useState<TopTalent[]>([])
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [allowHomepageView, setAllowHomepageView] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'packages' | 'events'>('packages')
  
  // Check if user intentionally navigated to homepage from dashboard
  const viewParam = searchParams.get('view')
  const fromDashboard = searchParams.get('from')
  const intentionalHomepageView = viewParam === 'homepage' || fromDashboard === 'dashboard'

  // Clean up URL parameters on mount if they exist
  useEffect(() => {
    if (intentionalHomepageView) {
      setAllowHomepageView(true)
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      let needsCleanup = false
      
      if (viewParam) {
        url.searchParams.delete('view')
        needsCleanup = true
      }
      if (fromDashboard) {
        url.searchParams.delete('from')
        needsCleanup = true
      }
      
      if (needsCleanup) {
        window.history.replaceState({}, '', url.pathname)
      }
    }
  }, [viewParam, fromDashboard, intentionalHomepageView])

  // Fetch dynamic content
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [talentsResponse, packagesResponse] = await Promise.all([
          fetch('/api/top-talents'),
          fetch('/api/packages/featured')
        ])
        
        const talentsData = await talentsResponse.json()
        const packagesData = await packagesResponse.json()
        
        if (talentsData.success) {
          setTopTalents(talentsData.talents || [])
        }
        
        if (packagesData.success) {
          setFeaturedPackages(packagesData.packages || [])
        }

        // Mock events data for now
        setFeaturedEvents([
          {
            id: '1',
            title: 'Corporate Annual Gala',
            category: 'Corporate',
            description: 'Looking for complete event management team',
            date: '2024-12-15',
            location: 'Nairobi',
            price: 150000,
            attendees: 45,
            maxAttendees: 200,
            organizer: { id: '1', name: 'Kenya Corp Ltd', verified: true }
          },
          {
            id: '2',
            title: 'Wedding Reception',
            category: 'Wedding',
            description: 'Need DJ, photographer, and catering services',
            date: '2024-11-28',
            location: 'Mombasa',
            price: 80000,
            attendees: 12,
            maxAttendees: 150,
            organizer: { id: '2', name: 'Sarah & John', verified: false }
          }
        ])
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
        setPackagesLoading(false)
        setEventsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/marketplace')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Popular categories for quick access
  const popularCategories = [
    { name: 'DJ', icon: Music, link: '/marketplace?category=DJ%20Services' },
    { name: 'Photography', icon: Camera, link: '/marketplace?category=Photography' },
    { name: 'MC', icon: Mic, link: '/marketplace?category=MC%20Services' },
    { name: 'Catering', icon: Utensils, link: '/marketplace?category=Catering' }
  ]


  return (
    <div className="min-h-screen bg-white">
      {/* Public Navigation Header */}
      <PublicHeader />

      {/* Hero Section - Upwork Inspired */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-30"
          >
            <source src="/hero-background-custom.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-blue-900/80 to-slate-900/70"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Kenya's Premier Marketplace for <span className="text-blue-400">Creatives</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-3xl"
            >
              Connecting clients to talented freelancers for seamless solutions
            </motion.p>
            
            {/* Enhanced Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8"
            >
              <div className="relative max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search for Packages & Events"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full h-16 pl-16 pr-36 text-lg rounded-2xl border-0 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 shadow-xl"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-3 bottom-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Search
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Popular Categories */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-8"
            >
              <p className="text-white/80 mb-4 text-lg">Popular categories:</p>
              <div className="flex flex-wrap gap-3">
                {popularCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <Link key={category.name} href={category.link}>
                      <Button 
                        variant="outline" 
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-300"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {category.name}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
            
            {/* User Path CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 items-start"
            >
              <Button 
                size="lg" 
                onClick={() => router.push('/marketplace')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Search className="mr-2 h-5 w-5" />
                Book Talent
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => router.push('/marketplace')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Briefcase className="mr-2 h-5 w-5" />
                Find Work
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => router.push('/organizer/events/new')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-sm px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Post a Job
              </Button>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Unified Marketplace Preview with Tabs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore Our Marketplace
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover packages and events from Kenya's top professionals
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'packages'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="inline mr-2 h-5 w-5" />
                Browse Packages
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'events'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="inline mr-2 h-5 w-5" />
                Browse Events
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'packages' ? (
              <motion.div
                key="packages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {packagesLoading ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading packages...</p>
                  </div>
                ) : featuredPackages.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No packages available"
                    description="Check back soon for featured packages"
                    size="lg"
                  />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {featuredPackages.slice(0, 6).map((pkg, index) => (
                      <motion.div
                        key={pkg.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {pkg.category}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{pkg.rating}</span>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-2xl font-bold text-blue-600">
                                  {pkg.priceIsHidden ? 'Contact for price' : formatCurrency(pkg.price)}
                                </p>
                                <p className="text-sm text-gray-500">{pkg.duration}</p>
                              </div>
                              <Link href={`/packages/${pkg.id}`}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="text-center">
                  <Link href="/packages">
                    <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                      View All Packages
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="events"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {eventsLoading ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading events...</p>
                  </div>
                ) : featuredEvents.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No events available"
                    description="Check back soon for featured events"
                    size="lg"
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {featuredEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {event.category}
                              </Badge>
                              {event.organizer.verified && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <Verified className="h-4 w-4" />
                                  <span className="text-xs">Verified</span>
                                </div>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                            <p className="text-gray-600 mb-4">{event.description}</p>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(event.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-2" />
                                {event.location}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Users className="h-4 w-4 mr-2" />
                                {event.attendees}/{event.maxAttendees} interested
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(event.price)}</p>
                                <p className="text-sm text-gray-500">Budget</p>
                              </div>
                              <Link href={`/marketplace?event=${event.id}`}>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Apply Now
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="text-center">
                  <Link href="/marketplace">
                    <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      View All Events
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* For Organizers Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                For <span className="text-blue-600">Organizers</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Find the perfect talent for your event with confidence and ease
              </p>
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Professionals</h3>
                    <p className="text-gray-600">All talents are background-checked and verified for quality assurance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
                    <p className="text-gray-600">Pay safely with our M-Pesa integrated escrow system</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <Headphones className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
                    <p className="text-gray-600">Get help whenever you need it with our dedicated support team</p>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={() => router.push('/marketplace')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
              >
                <Search className="mr-2 h-5 w-5" />
                Start Hiring
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Corporate Events</h3>
                  <p className="text-gray-600">Professional event management</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Event Planning</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Audio/Visual Setup</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Catering Services</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Talents Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="bg-green-50 rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Grow Your Business</h3>
                  <p className="text-gray-600">Expand your client base</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-700">Monthly Bookings</span>
                    <span className="text-green-600 font-bold">+45%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-700">Client Reviews</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-bold">4.9</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-gray-700">Earnings Growth</span>
                    <span className="text-green-600 font-bold">+67%</span>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                For <span className="text-green-600">Talents</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Showcase your skills and connect with clients who value your expertise
              </p>
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-600 rounded-lg p-2">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nationwide Reach</h3>
                    <p className="text-gray-600">Connect with clients across Kenya and expand your market</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-600 rounded-lg p-2">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Reputation</h3>
                    <p className="text-gray-600">Earn reviews and build a strong professional profile</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-600 rounded-lg p-2">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fair Pricing</h3>
                    <p className="text-gray-600">Set your own rates and get paid what you're worth</p>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={() => router.push('/auth/signup?role=talent')}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Join as Talent
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Something Amazing?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
              Join thousands of organizers and talents who trust GigSecure for their events
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => router.push('/marketplace')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Search className="mr-2 h-6 w-6" />
                Hire Talent Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => router.push('/auth/signup')}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Briefcase className="mr-2 h-6 w-6" />
                Start Earning Today
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold mb-6">For Organizers</h3>
              <ul className="space-y-3">
                <li><Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">Find Talent</Link></li>
                <li><Link href="/packages" className="text-gray-300 hover:text-white transition-colors">Browse Packages</Link></li>
                <li><Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6">For Talents</h3>
              <ul className="space-y-3">
                <li><Link href="/auth/signup" className="text-gray-300 hover:text-white transition-colors">Join GigSecure</Link></li>
                <li><Link href="/talent/dashboard" className="text-gray-300 hover:text-white transition-colors">Talent Dashboard</Link></li>
                <li><Link href="/success-stories" className="text-gray-300 hover:text-white transition-colors">Success Stories</Link></li>
                <li><Link href="/resources" className="text-gray-300 hover:text-white transition-colors">Resources</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-gray-300 hover:text-white transition-colors">Press</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6">Support</h3>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/terms-and-conditions" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/dispute-policy" className="text-gray-300 hover:text-white transition-colors">Dispute Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="text-2xl font-bold">GigSecure</div>
                <div className="text-gray-400">© 2024 All rights reserved</div>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <div className="w-6 h-6 bg-gray-400 rounded"></div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <div className="w-6 h-6 bg-gray-400 rounded"></div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-6 h-6 bg-gray-400 rounded"></div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <div className="w-6 h-6 bg-gray-400 rounded"></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
