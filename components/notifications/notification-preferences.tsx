
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  CreditCard,
  Star,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { NotificationPreference } from '@prisma/client'

interface NotificationPreferencesProps {
  className?: string
}

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      const data = await response.json()
      
      if (data.success) {
        setPreferences(data.data)
      } else {
        setError('Failed to load preferences')
      }
    } catch (err) {
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreference, value: boolean) => {
    if (!preferences) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [key]: value })
      })

      const data = await response.json()
      
      if (data.success) {
        setPreferences(prev => prev ? { ...prev, [key]: value } : null)
        setSuccess('Preferences updated')
        setTimeout(() => setSuccess(null), 2000)
      } else {
        setError(data.error || 'Failed to update preferences')
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      setError('Failed to update preferences')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) return null

  const preferenceSettings = [
    {
      key: 'emailMessages' as keyof NotificationPreference,
      icon: MessageSquare,
      title: 'Messages',
      description: 'Get notified when you receive new messages'
    },
    {
      key: 'emailBookings' as keyof NotificationPreference,
      icon: Calendar,
      title: 'Bookings',
      description: 'Notifications about booking requests, acceptances, and updates'
    },
    {
      key: 'emailPayments' as keyof NotificationPreference,
      icon: CreditCard,
      title: 'Payments',
      description: 'Payment confirmations and transaction updates'
    },
    {
      key: 'emailReviews' as keyof NotificationPreference,
      icon: Star,
      title: 'Reviews',
      description: 'When you receive new reviews from clients'
    },
    {
      key: 'emailReminders' as keyof NotificationPreference,
      icon: Clock,
      title: 'Event Reminders',
      description: 'Reminders about upcoming events (24 hours before)'
    },
    {
      key: 'emailPayouts' as keyof NotificationPreference,
      icon: CreditCard,
      title: 'Payouts',
      description: 'M-Pesa payout confirmations and processing updates'
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Manage your email notification preferences. In-app notifications are always enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Notification Preferences */}
        {preferenceSettings.map((setting, index) => (
          <div key={setting.key}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <setting.icon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor={setting.key}>{setting.title}</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {setting.description}
                </p>
              </div>
              <Switch
                id={setting.key}
                checked={preferences[setting.key] as boolean}
                onCheckedChange={(checked) => updatePreference(setting.key, checked)}
                disabled={saving}
              />
            </div>
            {index < preferenceSettings.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}

        {/* Admin-only preference */}
        {session?.user?.role === 'ADMIN' && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="emailAdminUpdates">Admin Updates</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Daily summaries and platform administration alerts
                </p>
              </div>
              <Switch
                id="emailAdminUpdates"
                checked={preferences.emailAdminUpdates}
                onCheckedChange={(checked) => updatePreference('emailAdminUpdates', checked)}
                disabled={saving}
              />
            </div>
          </>
        )}

        <div className="bg-muted/30 p-4 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Critical notifications (like payment confirmations and booking updates) 
            may still be sent via email regardless of these settings to ensure important information reaches you.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
