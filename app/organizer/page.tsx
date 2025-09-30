
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  MessageSquare, 
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  AlertCircle
} from 'lucide-react'
import type { OrganizerStats } from '@/lib/types'

interface Activity {
  id: string
  type: string
  description: string
  createdAt: string
}

function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/organizer/activity?limit=5')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setActivities(result.data.activities)
        }
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'EVENT_CREATED': return 'bg-green-500'
      case 'BOOKING_UPDATED': return 'bg-calm-soft-blue/100'
      case 'MESSAGE_SENT': return 'bg-purple-500'
      case 'REVIEW_CREATED': return 'bg-yellow-500'
      default: return 'bg-calm-light-grey0'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest platform activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</p>
                </div>
              </div>
            ))
          )}

          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/organizer/activity">
                <Eye className="mr-2 h-4 w-4" />
                View All Activity
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrganizerDashboard() {
  const [stats, setStats] = useState<OrganizerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/organizer')
      if (!response.ok) {
        throw new Error('Failed to fetch organizer stats')
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your events and bookings
          </p>
        </div>
        <Button asChild>
          <a href="/organizer/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">
              Currently recruiting talents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              All-time bookings made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Investment in talents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting talent response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedEvents}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.unreadMessages > 0 ? (
                <span className="text-red-600">{stats.unreadMessages}</span>
              ) : (
                <span className="text-green-600">0</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              New conversations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your organizing activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <a href="/organizer/events/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Event
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="/marketplace">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Marketplace
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="/organizer/bookings">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Bookings
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="/organizer/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Messages
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <RecentActivity />
      </div>
    </div>
  )
}
