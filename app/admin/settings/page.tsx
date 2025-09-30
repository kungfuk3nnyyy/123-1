'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Settings,
  CreditCard,
  Bell,
  Shield,
  Database,
  Mail,
  Percent,
  Globe,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface PlatformSettings {
  general: {
    platformName: string
    platformUrl: string
    platformDescription: string
    supportEmail: string
  }
  payment: {
    platformFee: number
    minPayout: number
    paystackKey: string
    webhookUrl: string
    autoPayouts: boolean
  }
  security: {
    twoFactor: boolean
    emailVerification: boolean
    profileApproval: boolean
    sessionTimeout: number
    maxLoginAttempts: number
  }
  notifications: {
    bookingNotifications: boolean
    paymentNotifications: boolean
    disputeNotifications: boolean
    systemNotifications: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUsername: string
    smtpPassword: string
    fromEmail: string
  }
  system: {
    maintenanceMode: boolean
  }
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetDialog, setResetDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (response.ok) {
        setSettings(data.settings)
        setHasChanges(false)
      } else {
        toast.error('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Settings saved successfully')
        setHasChanges(false)
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setSettings(data.settings)
        toast.success('Settings reset to defaults')
        setHasChanges(false)
      } else {
        toast.error(data.error || 'Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Error resetting settings')
    } finally {
      setSaving(false)
      setResetDialog(false)
    }
  }

  const updateSettings = (section: keyof PlatformSettings, key: string, value: any) => {
    if (!settings) return

    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">Platform Settings</h1>
          <p className="text-calm-dark-grey/80 mt-2">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-calm-dark-grey/80">Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">Platform Settings</h1>
          <p className="text-calm-dark-grey/80 mt-2">Configure platform-wide settings and preferences</p>
        </div>
        <div className="text-center py-12 text-gray-500">
          Failed to load settings. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">Platform Settings</h1>
          <p className="text-calm-dark-grey/80 mt-2">Configure platform-wide settings and preferences</p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input 
                id="platform-name" 
                value={settings.general.platformName}
                onChange={(e) => updateSettings('general', 'platformName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-url">Platform URL</Label>
              <Input 
                id="platform-url" 
                value={settings.general.platformUrl}
                onChange={(e) => updateSettings('general', 'platformUrl', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform-description">Platform Description</Label>
            <Textarea 
              id="platform-description" 
              value={settings.general.platformDescription}
              onChange={(e) => updateSettings('general', 'platformDescription', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">Support Email</Label>
            <Input 
              id="support-email" 
              type="email" 
              value={settings.general.supportEmail}
              onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>Configure payment processing and fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform-fee">Platform Commission (%)</Label>
              <div className="relative">
                <Input 
                  id="platform-fee" 
                  type="number" 
                  min="0" 
                  max="100"
                  value={settings.payment.platformFee}
                  onChange={(e) => updateSettings('payment', 'platformFee', parseFloat(e.target.value) || 0)}
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-payout">Minimum Payout Amount (KES)</Label>
              <Input 
                id="min-payout" 
                type="number"
                value={settings.payment.minPayout}
                onChange={(e) => updateSettings('payment', 'minPayout', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paystack-key">Paystack Secret Key</Label>
              <Input 
                id="paystack-key" 
                type="password" 
                value={settings.payment.paystackKey}
                onChange={(e) => updateSettings('payment', 'paystackKey', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input 
                id="webhook-url" 
                value={settings.payment.webhookUrl}
                onChange={(e) => updateSettings('payment', 'webhookUrl', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-payouts" 
              checked={settings.payment.autoPayouts}
              onCheckedChange={(checked) => updateSettings('payment', 'autoPayouts', checked)}
            />
            <Label htmlFor="auto-payouts">Enable automatic payouts</Label>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Platform security and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="two-factor" 
                checked={settings.security.twoFactor}
                onCheckedChange={(checked) => updateSettings('security', 'twoFactor', checked)}
              />
              <Label htmlFor="two-factor">Require two-factor authentication for admin accounts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="email-verification" 
                checked={settings.security.emailVerification}
                onCheckedChange={(checked) => updateSettings('security', 'emailVerification', checked)}
              />
              <Label htmlFor="email-verification">Require email verification for new accounts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="profile-approval" 
                checked={settings.security.profileApproval}
                onCheckedChange={(checked) => updateSettings('security', 'profileApproval', checked)}
              />
              <Label htmlFor="profile-approval">Manual approval required for talent profiles</Label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input 
                id="session-timeout" 
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value) || 60)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
              <Input 
                id="max-login-attempts" 
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="booking-notifications" 
                checked={settings.notifications.bookingNotifications}
                onCheckedChange={(checked) => updateSettings('notifications', 'bookingNotifications', checked)}
              />
              <Label htmlFor="booking-notifications">Send notifications for new bookings</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="payment-notifications" 
                checked={settings.notifications.paymentNotifications}
                onCheckedChange={(checked) => updateSettings('notifications', 'paymentNotifications', checked)}
              />
              <Label htmlFor="payment-notifications">Send notifications for payment events</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="dispute-notifications" 
                checked={settings.notifications.disputeNotifications}
                onCheckedChange={(checked) => updateSettings('notifications', 'disputeNotifications', checked)}
              />
              <Label htmlFor="dispute-notifications">Send alerts for booking disputes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="system-notifications" 
                checked={settings.notifications.systemNotifications}
                onCheckedChange={(checked) => updateSettings('notifications', 'systemNotifications', checked)}
              />
              <Label htmlFor="system-notifications">Send system maintenance notifications</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>Configure email delivery and templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input 
                id="smtp-host" 
                value={settings.email.smtpHost}
                onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input 
                id="smtp-port" 
                type="number"
                value={settings.email.smtpPort}
                onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value) || 587)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-username">SMTP Username</Label>
              <Input 
                id="smtp-username" 
                value={settings.email.smtpUsername}
                onChange={(e) => updateSettings('email', 'smtpUsername', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input 
                id="smtp-password" 
                type="password" 
                value={settings.email.smtpPassword}
                onChange={(e) => updateSettings('email', 'smtpPassword', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email Address</Label>
            <Input 
              id="from-email" 
              type="email" 
              value={settings.email.fromEmail}
              onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>System maintenance and data management tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline"
              onClick={() => toast.info('Database backup feature would be implemented')}
            >
              <Database className="mr-2 h-4 w-4" />
              Backup Database
            </Button>
            <Button 
              variant="outline"
              onClick={() => toast.info('Cache clearing feature would be implemented')}
            >
              <Globe className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
            <Button 
              variant="outline"
              onClick={() => toast.info('System diagnostics feature would be implemented')}
            >
              <Settings className="mr-2 h-4 w-4" />
              System Diagnostics
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch 
                id="maintenance-mode" 
                checked={settings.system.maintenanceMode}
                onCheckedChange={(checked) => updateSettings('system', 'maintenanceMode', checked)}
              />
              <Label htmlFor="maintenance-mode" className="text-red-700 font-medium">
                Enable maintenance mode
              </Label>
            </div>
            {settings.system.maintenanceMode && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Platform in maintenance mode</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => setResetDialog(true)}
          disabled={saving}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={fetchSettings}
            disabled={saving}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Reload Settings
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialog} onOpenChange={setResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Settings to Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all settings to their default values? 
              This action cannot be undone and will affect all platform configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700"
            >
              Reset Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
