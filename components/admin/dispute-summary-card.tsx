
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  TrendingDown,
  Shield
} from 'lucide-react'
import Link from 'next/link'

type UrgentDispute = {
  id: string
  eventTitle: string
  disputedBy: {
    name: string
    email: string
    role: string
  }
  reason: string
  status: string
  amount: number
  createdAt: string
  daysOpen?: number
}

interface DisputeData {
  statusSummary: {
    open: number
    underReview: number
    resolved: number
  }
  reasonSummary: Record<string, number>
  recentDisputes: Array<{
    id: string
    eventTitle: string
    disputedBy: {
      name: string
      email: string
      role: string
    }
    reason: string
    status: string
    amount: number
    createdAt: string
    isUrgent?: boolean
  }>
  urgentDisputes: Array<UrgentDispute>
  metrics: {
    totalDisputes: number
    activeDisputes: number
    urgentCount: number
    averageResolutionDays: number
    recentDisputeCount: number
    resolutionRate: number
  }
}

interface DisputeSummaryCardProps {
  data: DisputeData | null
  loading: boolean
}

export default function DisputeSummaryCard({ data, loading }: DisputeSummaryCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_: undefined, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load dispute data</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string, count: number) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        )
      case 'underReview':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        )
      case 'resolved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {count}
          </Badge>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const urgentCount = data.metrics.urgentCount
  const hasUrgentItems = urgentCount > 0
  const activeDisputes = data.metrics.activeDisputes

  return (
    <Card className={hasUrgentItems ? "border-red-200 bg-red-50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Active Disputes
              {hasUrgentItems && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {urgentCount} Urgent
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Booking disputes requiring resolution
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/disputes">
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Open</span>
              {getStatusBadge('open', data.statusSummary.open)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Review</span>
              {getStatusBadge('underReview', data.statusSummary.underReview)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resolved</span>
              {getStatusBadge('resolved', data.statusSummary.resolved)}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Resolution Rate</span>
              <span className="text-xs font-mono flex items-center">
                <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                {data.metrics.resolutionRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Resolution Time</span>
              <span className="text-xs font-mono">
                {data.metrics.averageResolutionDays.toFixed(1)} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Recent Disputes (7d)</span>
              <span className="text-xs font-mono">
                {data.metrics.recentDisputeCount}
              </span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-600">Needs Urgent Action</span>
                <span className="text-xs font-mono text-red-600">
                  {urgentCount} disputes
                </span>
              </div>
            )}
          </div>

          {/* Urgent Disputes Preview */}
          {hasUrgentItems && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-red-600 mb-2">Most Urgent:</p>
              {data.urgentDisputes.slice(0, 2).map((dispute: UrgentDispute) => (
                <div key={dispute.id} className="text-xs text-muted-foreground mb-1">
                  <span className="font-medium">{dispute.eventTitle}</span>
                  <span className="ml-2">({dispute.daysOpen}d old)</span>
                  <span className="ml-2">{formatCurrency(dispute.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
