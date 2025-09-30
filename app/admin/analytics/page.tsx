
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Download,
  RefreshCw,
  Star,
  Award
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface AnalyticsData {
  currentMetrics: {
    monthlyRevenue: number
    activeUsers: number
    totalBookings: number
    successRate: number
  }
  growth: {
    revenue: number
    users: number
    bookings: number
    successRate: number
  }
  chartData: {
    monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>
    userGrowth: Array<{ month: string; talents: number; organizers: number }>
    categoryData: Array<{ name: string; value: number; color: string }>
    topTalents: Array<{ name: string; category: string; rating: number; bookings: number }>
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6months')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      const data = await response.json()

      if (response.ok) {
        setAnalyticsData(data)
      } else {
        toast.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Error loading analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `KES ${(amount / 1000).toFixed(0)}K`
    }
    return `KES ${amount.toLocaleString()}`
  }

  const handleExportReport = () => {
    if (!analyticsData) return
    
    // Create CSV content with analytics data
    const csvContent = [
      'Analytics Report',
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Period: ${period}`,
      '',
      'Key Metrics',
      `Monthly Revenue,${analyticsData.currentMetrics.monthlyRevenue}`,
      `Active Users,${analyticsData.currentMetrics.activeUsers}`,
      `Total Bookings,${analyticsData.currentMetrics.totalBookings}`,
      `Success Rate,${analyticsData.currentMetrics.successRate}%`,
      '',
      'Monthly Revenue Data',
      'Month,Revenue,Bookings',
      ...analyticsData.chartData.monthlyRevenue.map(item => 
        `${item.month},${item.revenue},${item.bookings}`
      ),
      '',
      'Top Talents',
      'Name,Category,Rating,Bookings',
      ...analyticsData.chartData.topTalents.map(talent => 
        `${talent.name},${talent.category},${talent.rating},${talent.bookings}`
      )
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <p className={`text-xs flex items-center mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {isPositive ? '+' : ''}{growth.toFixed(1)}% from last month
      </p>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-calm-dark-grey">Analytics Dashboard</h1>
            <p className="text-calm-dark-grey/80 mt-2">Platform performance metrics and insights</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-calm-dark-grey/80">Loading analytics data...</span>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-calm-dark-grey">Analytics Dashboard</h1>
            <p className="text-calm-dark-grey/80 mt-2">Platform performance metrics and insights</p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500">
          Failed to load analytics data. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">Analytics Dashboard</h1>
          <p className="text-calm-dark-grey/80 mt-2">Platform performance metrics and insights</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.currentMetrics.monthlyRevenue)}
            </div>
            {formatGrowth(analyticsData.growth.revenue)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-calm-soft-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.currentMetrics.activeUsers.toLocaleString()}</div>
            {formatGrowth(analyticsData.growth.users)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.currentMetrics.totalBookings.toLocaleString()}</div>
            {formatGrowth(analyticsData.growth.bookings)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.currentMetrics.successRate.toFixed(1)}%</div>
            {formatGrowth(analyticsData.growth.successRate)}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue and booking growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analyticsData.chartData.monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  label={{ value: 'Month', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  label={{ value: 'Revenue (KES)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#60B5FF" 
                  strokeWidth={3}
                  name="revenue"
                  dot={{ fill: '#60B5FF', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#60B5FF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Talents vs Organizers registration trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analyticsData.chartData.userGrowth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  label={{ value: 'Month', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  label={{ value: 'Users', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <Tooltip />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="talents" fill="#FF9149" name="Talents" radius={[2, 2, 0, 0]} />
                <Bar dataKey="organizers" fill="#80D8C3" name="Organizers" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Categories & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Categories</CardTitle>
            <CardDescription>Distribution of bookings by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={analyticsData.chartData.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analyticsData.chartData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {analyticsData.chartData.categoryData.map((item, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}: {item.value}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Highest rated talents this period</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {analyticsData.chartData.topTalents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No performance data available for this period
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData.chartData.topTalents.map((talent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-calm-soft-blue/100'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-calm-dark-grey">{talent.name}</p>
                        <p className="text-sm text-calm-dark-grey/80">{talent.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <p className="font-semibold text-calm-dark-grey">{talent.rating.toFixed(1)}</p>
                      </div>
                      <p className="text-sm text-calm-dark-grey/80">{talent.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
          <CardDescription>Key insights for the selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(analyticsData.currentMetrics.monthlyRevenue)}
              </p>
              <p className="text-sm text-green-600">Total Revenue</p>
            </div>
            <div className="text-center p-4 bg-calm-soft-blue/10 rounded-lg">
              <Users className="h-8 w-8 text-calm-soft-blue mx-auto mb-2" />
              <p className="text-2xl font-bold text-calm-soft-blue">
                {analyticsData.currentMetrics.activeUsers.toLocaleString()}
              </p>
              <p className="text-sm text-calm-soft-blue">Active Users</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">
                {analyticsData.currentMetrics.totalBookings.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600">Total Bookings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
