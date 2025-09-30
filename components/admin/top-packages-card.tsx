
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Star,
  ExternalLink,
  DollarSign,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

type TopTalent = {
  talentId: string
  talentName: string
  category: string
  bookingCount: number
  totalRevenue: number
  averageBookingValue: number
  packages: Array<{
    id: string
    title: string
    category: string
    price: number
    coverImageUrl: string | null
    isPublished: boolean
  }>
  trend: {
    percentage: number
    direction: 'up' | 'down'
    previousPeriodCount: number
  }
}

interface TopPackageData {
  topPackages: Array<TopTalent>
  summary: {
    totalAnalyzedBookings: number
    totalTalentsWithBookings: number
    period: string
    averageBookingsPerTalent: number
  }
}

interface TopPackagesCardProps {
  data: TopPackageData | null
  loading: boolean
}

export default function TopPackagesCard({ data, loading }: TopPackagesCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-56"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_: undefined, i: number) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.topPackages.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <Package className="h-5 w-5" />
            <span>No booking data available for the selected period</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTrendIcon = (direction: 'up' | 'down', percentage: number) => {
    if (direction === 'up') {
      return <TrendingUp className="w-3 h-3 text-green-600" />
    }
    return <TrendingDown className="w-3 h-3 text-red-600" />
  }

  const getTrendBadge = (trend: { percentage: number; direction: 'up' | 'down' }) => {
    const isPositive = trend.direction === 'up'
    return (
      <Badge 
        variant={isPositive ? "default" : "secondary"} 
        className={isPositive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800"}
      >
        {getTrendIcon(trend.direction, trend.percentage)}
        <span className="ml-1">{Math.abs(trend.percentage)}%</span>
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Top Performing Talents
            </CardTitle>
            <CardDescription>
              Most booked talents in the last {data.summary.period}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/packages">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold">{data.summary.totalAnalyzedBookings}</div>
              <div className="text-xs text-muted-foreground">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{data.summary.totalTalentsWithBookings}</div>
              <div className="text-xs text-muted-foreground">Active Talents</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{data.summary.averageBookingsPerTalent}</div>
              <div className="text-xs text-muted-foreground">Avg per Talent</div>
            </div>
          </div>

          {/* Top Talents List */}
          <div className="space-y-3">
            {data.topPackages.slice(0, 5).map((talent: TopTalent, index: number) => (
              <div key={talent.talentId} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">#{index + 1}</span>
                </div>

                {/* Talent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate">{talent.talentName}</p>
                    <Badge variant="outline" className="text-xs">
                      {talent.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {talent.bookingCount} bookings
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(talent.totalRevenue)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Avg: {formatCurrency(talent.averageBookingValue)} per booking
                  </div>
                </div>

                {/* Trend */}
                <div className="flex-shrink-0">
                  {getTrendBadge(talent.trend)}
                </div>
              </div>
            ))}
          </div>

          {/* Packages Count */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Package Portfolio</span>
              <span>
                {data.topPackages.reduce((sum, talent) => sum + talent.packages.length, 0)} total packages
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
