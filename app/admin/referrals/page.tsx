
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Search,
  CheckCircle,
  Clock,
  Gift,
  UserPlus,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminReferralStats {
  totalReferrals: number
  totalConversions: number
  conversionRate: number
  totalRewardsPaid: number
  recentActivity: Array<{
    id: string
    referrer: {
      id: string
      name: string
      email: string
    }
    referred: {
      id: string
      name: string
      email: string
    }
    status: 'PENDING' | 'CONVERTED'
    rewardStatus: 'PENDING' | 'CREDITED' | 'FAILED'
    createdAt: string
    convertedAt: string | null
  }>
}

export default function AdminReferralsPage() {
  const [stats, setStats] = useState<AdminReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReferralStats()
  }, [])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/admin/referrals')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      } else {
        console.error('Failed to fetch admin referral stats')
        toast.error('Failed to load referral statistics')
      }
    } catch (error) {
      console.error('Error fetching admin referral stats:', error)
      toast.error('Error loading referral data')
    } finally {
      setLoading(false)
    }
  }

  const filteredActivity = stats?.recentActivity?.filter(
    activity =>
      activity.referrer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.referrer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.referred.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.referred.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-2"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gift className="text-purple-600" />
          Referral Program Management
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage the GigSecure referral program performance
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              All-time referrals made
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConversions?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Referral to conversion ratio
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {stats?.totalRewardsPaid?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime rewards distributed
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Referral Activity
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search referrals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                onClick={fetchReferralStats}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredActivity.length > 0 ? (
              <div className="space-y-4">
                {filteredActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {activity.referrer.name?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.referrer.name}</p>
                          <p className="text-xs text-muted-foreground">{activity.referrer.email}</p>
                        </div>
                      </div>
                      
                      <div className="text-muted-foreground text-sm">→</div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {activity.referred.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.referred.name}</p>
                          <p className="text-xs text-muted-foreground">{activity.referred.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <Badge 
                          variant={activity.status === 'CONVERTED' ? 'default' : 'secondary'}
                          className="mb-1"
                        >
                          {activity.status === 'CONVERTED' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {activity.status === 'CONVERTED' && activity.convertedAt
                            ? `Converted: ${new Date(activity.convertedAt).toLocaleDateString()}`
                            : `Referred: ${new Date(activity.createdAt).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      
                      {activity.status === 'CONVERTED' && (
                        <div className="text-green-600 font-medium text-sm">
                          KES 1,500
                          <p className="text-xs text-muted-foreground">rewards paid</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Referral Activity</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No referrals match your search criteria.' : 'No referrals have been made yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Program Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Referral Program Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50">
                <UserPlus className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold mb-2">New User Reward</h3>
                <p className="text-2xl font-bold text-blue-600 mb-1">KES 500</p>
                <p className="text-sm text-muted-foreground">
                  Credit given to new users upon registration
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-green-50">
                <Gift className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold mb-2">Referrer Reward</h3>
                <p className="text-2xl font-bold text-green-600 mb-1">KES 1,000</p>
                <p className="text-sm text-muted-foreground">
                  Reward for referrer on successful conversion
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50">
                <Target className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-semibold mb-2">Conversion Events</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">Organizers:</span> First booking payment
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Talents:</span> First payout received
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
