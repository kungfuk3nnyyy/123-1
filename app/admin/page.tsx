
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  BarChart3,
  Package,
  FileCheck,
  Shield,
  Globe
} from 'lucide-react'
import type { 
  AdminStats, 
  RegistrationAnalytics, 
  BookingAnalytics, 
  TopPackageAnalytics, 
  KycAnalytics, 
  DisputeAnalytics 
} from '@/lib/types'
import TimelineChart from '@/components/admin/timeline-chart'
import KycSummaryCard from '@/components/admin/kyc-summary-card'
import DisputeSummaryCard from '@/components/admin/dispute-summary-card'
import TopPackagesCard from '@/components/admin/top-packages-card'

interface HealthStatus {
  status: 'operational' | 'degraded' | 'down'
  message: string
  responseTime?: number
}

interface SystemHealth {
  system: HealthStatus
  database: HealthStatus
  paymentGateway: HealthStatus
  notifications: HealthStatus
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [registrationData, setRegistrationData] = useState<RegistrationAnalytics | null>(null)
  const [bookingData, setBookingData] = useState<BookingAnalytics | null>(null)
  const [topPackagesData, setTopPackagesData] = useState<TopPackageAnalytics | null>(null)
  const [kycData, setKycData] = useState<KycAnalytics | null>(null)
  const [disputeData, setDisputeData] = useState<DisputeAnalytics | null>(null)
  const [timePeriod, setTimePeriod] = useState('30')
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
    fetchHealth()
    fetchAnalytics()
    // Refresh health status every 30 seconds
    const healthInterval = setInterval(fetchHealth, 30000)
    return () => clearInterval(healthInterval)
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [timePeriod])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/admin')
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats')
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

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/admin/health')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHealth(data.data.health)
        }
      }
    } catch (err) {
      console.error('Failed to fetch health status:', err)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      
      // Fetch all analytics data in parallel
      const [registrationRes, bookingRes, topPackagesRes, kycRes, disputeRes] = await Promise.all([
        fetch(`/api/admin/analytics/registrations?days=${timePeriod}`),
        fetch(`/api/admin/analytics/bookings?days=${timePeriod}`),
        fetch(`/api/admin/analytics/top-packages?days=${timePeriod}&limit=5`),
        fetch('/api/admin/analytics/kyc-summary'),
        fetch('/api/admin/analytics/disputes')
      ])

      const [registrationData, bookingData, topPackagesData, kycData, disputeData] = await Promise.all([
        registrationRes.ok ? registrationRes.json() : null,
        bookingRes.ok ? bookingRes.json() : null,
        topPackagesRes.ok ? topPackagesRes.json() : null,
        kycRes.ok ? kycRes.json() : null,
        disputeRes.ok ? disputeRes.json() : null
      ])

      if (registrationData?.success) setRegistrationData(registrationData.data)
      if (bookingData?.success) setBookingData(bookingData.data)
      if (topPackagesData?.success) setTopPackagesData(topPackagesData.data)
      if (kycData?.success) setKycData(kycData.data)
      if (disputeData?.success) setDisputeData(disputeData.data)

    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const refreshData = async () => {
    await Promise.all([fetchStats(), fetchHealth(), fetchAnalytics()])
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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
            <Button onClick={refreshData} className="mt-4" variant="outline">
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

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
        <span className="text-xs font-medium">{Math.abs(growth)}%</span>
      </div>
    )
  }

  const getHealthBadge = (healthStatus: HealthStatus | undefined, label: string) => {
    if (!healthStatus) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Loading...
        </Badge>
      )
    }

    switch (healthStatus.status) {
      case 'operational':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            {healthStatus.message}
          </Badge>
        )
      case 'degraded':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            {healthStatus.message}
          </Badge>
        )
      case 'down':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            {healthStatus.message}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">
            Comprehensive admin dashboard with real-time analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Active platform users</p>
              {formatGrowth(stats.monthlyGrowth.users)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Processed payments</p>
              {formatGrowth(stats.monthlyGrowth.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.platformFees)}</div>
            <p className="text-xs text-muted-foreground">10% commission earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">Currently recruiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Timeline Analytics
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Package className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="operations">
            <Globe className="h-4 w-4 mr-2" />
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Registration Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Registrations
                  {analyticsLoading && <RefreshCw className="h-4 w-4 ml-2 animate-spin" />}
                </CardTitle>
                <CardDescription>
                  New talent and organizer registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registrationData ? (
                  <div className="space-y-4">
                    <TimelineChart 
                      data={registrationData.timeline}
                      type="registrations"
                      height={250}
                    />
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold">{registrationData.summary.totalRegistrations}</div>
                        <div className="text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="font-semibold">{registrationData.summary.totalTalents}</div>
                        <div className="text-muted-foreground">Talents</div>
                      </div>
                      <div>
                        <div className="font-semibold">{registrationData.summary.totalOrganizers}</div>
                        <div className="text-muted-foreground">Organizers</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Loading registration data...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Booking Activity
                  {analyticsLoading && <RefreshCw className="h-4 w-4 ml-2 animate-spin" />}
                </CardTitle>
                <CardDescription>
                  Booking creation vs completion timeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingData ? (
                  <div className="space-y-4">
                    <TimelineChart 
                      data={bookingData.timeline}
                      type="bookings"
                      height={250}
                    />
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold">{bookingData.summary.totalCreated}</div>
                        <div className="text-muted-foreground">Created</div>
                      </div>
                      <div>
                        <div className="font-semibold">{bookingData.summary.totalCompleted}</div>
                        <div className="text-muted-foreground">Completed</div>
                      </div>
                      <div>
                        <div className="font-semibold">{bookingData.summary.completionRate}%</div>
                        <div className="text-muted-foreground">Success Rate</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Loading booking data...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <TopPackagesCard data={topPackagesData} loading={analyticsLoading} />
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* KYC Summary */}
            <KycSummaryCard data={kycData} loading={analyticsLoading} />

            {/* Dispute Summary */}
            <DisputeSummaryCard data={disputeData} loading={analyticsLoading} />

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    System Health
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchHealth}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Real-time system monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System</span>
                    {getHealthBadge(health?.system, 'System')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    {getHealthBadge(health?.database, 'Database')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Payments</span>
                    {getHealthBadge(health?.paymentGateway, 'Payment Gateway')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Notifications</span>
                    {getHealthBadge(health?.notifications, 'Notifications')}
                  </div>
                  {health?.database?.responseTime && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">DB Response</span>
                      <span className="text-xs font-mono">{health.database.responseTime}ms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks and management links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/bookings">
                <Calendar className="mr-2 h-4 w-4" />
                Review Bookings
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/payouts">
                <DollarSign className="mr-2 h-4 w-4" />
                Process Payouts
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/kyc-submissions">
                <FileCheck className="mr-2 h-4 w-4" />
                KYC Reviews
                {kycData?.metrics?.pendingCount ? (
                  <Badge variant="destructive" className="ml-2">
                    {kycData.metrics.pendingCount}
                  </Badge>
                ) : null}
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/admin/disputes">
                <Shield className="mr-2 h-4 w-4" />
                Manage Disputes
                {disputeData?.metrics?.activeDisputes ? (
                  <Badge variant="destructive" className="ml-2">
                    {disputeData.metrics.activeDisputes}
                  </Badge>
                ) : null}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
