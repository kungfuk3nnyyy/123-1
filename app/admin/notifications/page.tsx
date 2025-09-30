
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  CreditCard, 
  Star, 
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  ArrowLeft,
  MoreHorizontal,
  Check,
  X
} from 'lucide-react'
import { Notification, NotificationType } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'

// Map notification types to icons
const notificationIcons: Record<NotificationType, any> = {
  MESSAGE_RECEIVED: MessageSquare,
  BOOKING_REQUEST: Calendar,
  BOOKING_ACCEPTED: CheckCircle,
  BOOKING_DECLINED: AlertCircle,
  BOOKING_PAYMENT_CONFIRMED: CreditCard,
  PAYOUT_PROCESSED: CreditCard,
  REVIEW_RECEIVED: Star,
  EVENT_REMINDER: Clock,
  BOOKING_COMPLETED: CheckCircle,
  ADMIN_USER_REGISTRATION: Users,
  DISPUTE_CREATED: AlertCircle,
  DISPUTE_RESOLVED: CheckCircle,
  DIRECT_MESSAGE: MessageSquare
}

// Map notification types to colors
const notificationColors: Record<NotificationType, string> = {
  MESSAGE_RECEIVED: 'text-calm-soft-blue',
  DIRECT_MESSAGE: 'text-blue-500',
  BOOKING_REQUEST: 'text-purple-600',
  BOOKING_ACCEPTED: 'text-green-600',
  BOOKING_DECLINED: 'text-red-600',
  BOOKING_PAYMENT_CONFIRMED: 'text-green-600',
  PAYOUT_PROCESSED: 'text-green-600',
  REVIEW_RECEIVED: 'text-yellow-600',
  EVENT_REMINDER: 'text-orange-600',
  BOOKING_COMPLETED: 'text-green-600',
  ADMIN_USER_REGISTRATION: 'text-calm-soft-blue',
  DISPUTE_CREATED: 'text-red-600',
  DISPUTE_RESOLVED: 'text-green-600'
}

export default function AdminNotificationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalNotifications, setTotalNotifications] = useState(0)
  const pageSize = 20

  // Fetch notifications based on filters
  const fetchNotifications = async (tab: string = activeTab, page: number = 1) => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const offset = (page - 1) * pageSize
      const unreadOnly = tab === 'unread'
      
      const response = await fetch(
        `/api/notifications?limit=${pageSize}&offset=${offset}&unreadOnly=${unreadOnly}`
      )
      const data = await response.json()
      
      if (data.success) {
        let filteredNotifications = data.data.notifications || []
        
        // Apply client-side filtering for read-only
        if (tab === 'read') {
          filteredNotifications = filteredNotifications.filter((n: Notification) => n.isRead)
        }
        
        setNotifications(filteredNotifications)
        setTotalNotifications(data.data.total || filteredNotifications.length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [session?.user?.id, activeTab, currentPage])

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PUT'
        })
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        )
      }

      // Navigate to action URL if provided
      if (notification.actionUrl) {
        router.push(notification.actionUrl)
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Toggle individual notification read status
  const handleToggleRead = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      if (!notification.isRead) {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PUT'
        })
        
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        )
      }
    } catch (error) {
      console.error('Error toggling read status:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const totalPages = Math.ceil(totalNotifications / pageSize)

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push('/admin')}
          className="hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            All Notifications
          </h1>
          <p className="text-muted-foreground">
            Manage your platform notifications and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        setCurrentPage(1)
      }} className="mb-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : activeTab === 'read'
                      ? "No read notifications found."
                      : "You don't have any notifications yet."
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-300px)]">
                  <div className="divide-y">
                    {notifications.map((notification, index) => {
                      const IconComponent = notificationIcons[notification.type]
                      const iconColor = notificationColors[notification.type]
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                            !notification.isRead ? 'bg-calm-soft-blue/10/50 hover:bg-calm-soft-blue/20/50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-4">
                            <div className={`flex-shrink-0 mt-1 ${iconColor}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className={`font-medium text-sm leading-tight ${
                                    !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                    {!notification.isRead && (
                                      <>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <Badge variant="secondary" className="text-xs px-2 py-0">
                                          New
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => handleToggleRead(notification, e)}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalNotifications)} of {totalNotifications} notifications
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
