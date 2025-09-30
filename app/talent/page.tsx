
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  DollarSign, 
  Star, 
  MessageSquare, 
  TrendingUp,
  Clock,
  User,
  Camera,
  CheckCircle,
  AlertCircle,
  BanknoteIcon,
  Edit
} from 'lucide-react'
import type { TalentStats } from '@/lib/types'
import Link from 'next/link'

export default function TalentDashboard() {
  const [stats, setStats] = useState<TalentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/talent')
      if (!response.ok) {
        throw new Error('Failed to fetch talent stats')
      }
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
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
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading dashboard: {error}</span>
            </div>
            <Button onClick={fetchStats} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talent Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your bookings, earnings, and profile
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Confirmed and in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingPayouts)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting transfer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              This month's income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile & Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Profile Completion
              <Edit className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </CardTitle>
            <CardDescription>Complete your profile to attract more clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{stats.profileCompletion}%</span>
                </div>
                <Progress value={stats.profileCompletion} className="h-2" />
              </div>
              
              <div className="grid gap-2">
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link href="/talent/profile">
                    <Camera className="mr-2 h-4 w-4" />
                    Add Portfolio Images
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link href="/talent/profile">
                    <User className="mr-2 h-4 w-4" />
                    Update Bio & Skills
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link href="/talent/payouts">
                    <BanknoteIcon className="mr-2 h-4 w-4" />
                    Setup M-Pesa Payouts
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Your ratings and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">Average Rating</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {stats.averageRating 
                      ? parseFloat(stats.averageRating.toString()).toFixed(1)
                      : '0.0'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    from {stats.totalReviews} reviews
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Unread Messages</span>
                </div>
                <div>
                  {stats.unreadMessages > 0 ? (
                    <Badge variant="destructive">{stats.unreadMessages}</Badge>
                  ) : (
                    <Badge variant="secondary">0</Badge>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button className="w-full" asChild>
                  <Link href="/talent/messages">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View All Messages
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your talent activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/talent/bookings">
                <Calendar className="mr-2 h-4 w-4" />
                View Bookings
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/talent/earnings">
                <DollarSign className="mr-2 h-4 w-4" />
                Track Earnings
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/talent/profile">
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/talent/profile">
                <Camera className="mr-2 h-4 w-4" />
                Manage Portfolio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
