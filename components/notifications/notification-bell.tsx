
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  CreditCard, 
  Star, 
  Clock,
  CheckCircle,
  AlertCircle,
  Users
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

export function NotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications?limit=10&offset=0')
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.data.notifications || [])
        const unread = data.data.notifications?.filter((n: Notification) => !n.isRead).length || 0
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!session?.user?.id) return

    fetchNotifications()
    
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    
    return () => clearInterval(interval)
  }, [session?.user?.id])

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PUT'
        })
        
        // Update local state
        setNotifications(prev => 
          prev.map((n: Notification) => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      // Navigate to action URL if provided
      if (notification.actionUrl) {
        router.push(notification.actionUrl)
      }

      setIsOpen(false)
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        setNotifications(prev => prev.map((n: Notification) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user?.id) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => {
                const IconComponent = notificationIcons[notification.type]
                const iconColor = notificationColors[notification.type]
                
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'bg-calm-soft-blue/10 hover:bg-blue-100' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3 w-full">
                      <div className={`flex-shrink-0 mt-1 ${iconColor}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-tight ${
                            !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-xs"
                onClick={() => {
                  const role = session.user.role?.toLowerCase()
                  router.push(`/${role}/notifications`)
                  setIsOpen(false)
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
