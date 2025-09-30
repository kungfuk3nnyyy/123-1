
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Activity as ActivityIcon, 
  Search, 
  Calendar, 
  MessageSquare, 
  User, 
  Star,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'

interface Activity {
  id: string
  type: string
  description: string
  createdAt: string
  metadata?: any
}

interface ActivitiesData {
  activities: Activity[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ActivityPage() {
  const [data, setData] = useState<ActivitiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchActivities()
  }, [currentPage])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      const response = await fetch(`/api/organizer/activity?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch activities')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'EVENT_CREATED': return <FileText className="h-4 w-4" />
      case 'EVENT_UPDATED': return <FileText className="h-4 w-4" />
      case 'BOOKING_UPDATED': return <User className="h-4 w-4" />
      case 'MESSAGE_SENT': return <MessageSquare className="h-4 w-4" />
      case 'REVIEW_CREATED': return <Star className="h-4 w-4" />
      case 'PROFILE_UPDATED': return <User className="h-4 w-4" />
      default: return <ActivityIcon className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'EVENT_CREATED': return 'bg-green-100 text-green-800'
      case 'EVENT_UPDATED': return 'bg-calm-soft-blue/20 text-blue-800'
      case 'BOOKING_UPDATED': return 'bg-purple-100 text-purple-800'
      case 'MESSAGE_SENT': return 'bg-indigo-100 text-indigo-800'
      case 'REVIEW_CREATED': return 'bg-yellow-100 text-yellow-800'
      case 'PROFILE_UPDATED': return 'bg-calm-light-grey text-calm-dark-grey'
      default: return 'bg-calm-light-grey text-calm-dark-grey'
    }
  }

  const filteredActivities = data?.activities?.filter(activity =>
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Track your platform activities</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span>Error loading activities: {error}</span>
            </div>
            <Button onClick={fetchActivities} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          Track your platform activities and actions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              All-time activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredActivities.filter(a => {
                const activityDate = new Date(a.createdAt)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return activityDate >= weekAgo
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const typeCounts = filteredActivities.reduce((acc, activity) => {
                  acc[activity.type] = (acc[activity.type] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                
                const mostActive = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]
                return mostActive ? mostActive[0].replace('_', ' ') : 'None'
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Activity type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <EmptyState
            icon={searchTerm ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.icon : ActivityIcon}
            title={searchTerm ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.title : 'No Activities Yet'}
            description={searchTerm ? 
              EMPTY_STATES.SEARCH_NO_RESULTS.description : 'Your activities will appear here as you use the platform.'}
            size="lg"
            action={searchTerm ? {
              label: 'Clear Search',
              onClick: () => setSearchTerm('')
            } : undefined}
          />
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-calm-dark-grey">
                        {activity.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDateTime(activity.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * data.pagination.limit) + 1} to {Math.min(currentPage * data.pagination.limit, data.pagination.total)} of {data.pagination.total} activities
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {data.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === data.pagination.pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
