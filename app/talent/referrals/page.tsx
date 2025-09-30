
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Gift, 
  Share, 
  Copy, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Star,
  Send,
  Facebook,
  Twitter,
  MessageSquare,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface ReferralStats {
  referralCode: string | null
  accountCreditKes: number
  totalReferrals: number
  totalEarned: number
  conversions: number
  pendingReferrals: number
  referralHistory: Array<{
    id: string
    referredUser: {
      id: string
      name: string
      email: string
      joinedAt: string
    }
    status: 'PENDING' | 'CONVERTED'
    rewardStatus: 'PENDING' | 'CREDITED' | 'FAILED'
    referrerReward: number
    convertedAt: string | null
    conversionType: string | null
    createdAt: string
  }>
}

export default function TalentReferralsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    fetchReferralStats()
  }, [])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referrals')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      } else {
        console.error('Failed to fetch referral stats')
        toast.error('Failed to load referral statistics')
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
      toast.error('Error loading referral data')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    if (!stats?.referralCode) return
    
    setCopying(true)
    const referralLink = `${window.location.origin}/auth/signup?ref=${stats.referralCode}`
    
    try {
      await navigator.clipboard.writeText(referralLink)
      toast.success('Referral link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy referral link')
    } finally {
      setCopying(false)
    }
  }

  const shareOnSocial = (platform: string) => {
    if (!stats?.referralCode) return
    
    const referralLink = `${window.location.origin}/auth/signup?ref=${stats.referralCode}`
    const message = `Join GigSecure using my referral link and get KES 500 credit! ${referralLink}`
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      email: `mailto:?subject=${encodeURIComponent('Join GigSecure and Get KES 500!')}&body=${encodeURIComponent(message)}`
    }
    
    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank')
    }
  }

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
          <Gift className="text-green-600" />
          Refer & Earn
        </h1>
        <p className="text-muted-foreground">
          Earn KES 1,000 for each friend who joins and completes their first booking payout!
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Credit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {stats?.accountCreditKes?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available platform credit
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Friends referred
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {stats?.totalEarned?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral Link Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5 text-blue-600" />
              Your Referral Link
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Share this link and earn KES 1,000 when your friends sign up and complete their first payout!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.referralCode && (
              <>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/auth/signup?ref=${stats.referralCode}`}
                    className="flex-1"
                  />
                  <Button
                    onClick={copyReferralLink}
                    disabled={copying}
                    size="sm"
                    className="px-4"
                  >
                    {copying ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => shareOnSocial('facebook')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('twitter')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('whatsapp')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('email')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>How the Referral Program Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-blue-50">
                <Send className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold mb-2">1. Share Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Share your unique referral link with friends and family
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-green-50">
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold mb-2">2. Friend Joins & Gets Credit</h3>
                <p className="text-sm text-muted-foreground">
                  They sign up using your link and receive KES 500 credit
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-yellow-50">
                <Gift className="h-8 w-8 text-yellow-600 mb-2" />
                <h3 className="font-semibold mb-2">3. You Earn KES 1,000</h3>
                <p className="text-sm text-muted-foreground">
                  When they complete their first payout, you earn KES 1,000!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral History */}
      {stats?.referralHistory && stats.referralHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your referrals and earnings
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.referralHistory.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {referral.referredUser.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{referral.referredUser.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(referral.referredUser.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={referral.status === 'CONVERTED' ? 'default' : 'secondary'}>
                        {referral.status === 'CONVERTED' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {referral.status}
                      </Badge>
                      {referral.status === 'CONVERTED' && (
                        <div className="text-green-600 font-medium">
                          +KES 1,000
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
