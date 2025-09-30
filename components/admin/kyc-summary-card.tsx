
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface KycData {
  statusSummary: {
    pending: number
    verified: number
    rejected: number
    unverified: number
  }
  recentSubmissions: Array<{
    id: string
    userName: string
    userEmail: string
    userRole: string
    documentType: string
    status: string
    submittedAt: string
    isOverdue?: boolean
  }>
  overdueSubmissions: Array<{
    id: string
    userName: string
    userEmail: string
    userRole: string
    documentType: string
    submittedAt: string
    daysOverdue?: number
  }>
  metrics: {
    totalSubmissions: number
    pendingCount: number
    overdueCount: number
    averageProcessingDays: number
    recentSubmissionCount: number
  }
}

interface KycSummaryCardProps {
  data: KycData | null
  loading: boolean
}

export default function KycSummaryCard({ data, loading }: KycSummaryCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_: undefined, i: number) => (
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
            <span>Failed to load KYC data</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string, count: number) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        )
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <FileCheck className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        )
    }
  }

  const urgentCount = data.overdueSubmissions.length
  const hasUrgentItems = urgentCount > 0

  return (
    <Card className={hasUrgentItems ? "border-orange-200 bg-orange-50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileCheck className="h-5 w-5 mr-2" />
              KYC Submissions
              {hasUrgentItems && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {urgentCount} Overdue
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Document verification status and processing
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/kyc-submissions">
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pending</span>
              {getStatusBadge('pending', data.statusSummary.pending)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verified</span>
              {getStatusBadge('verified', data.statusSummary.verified)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rejected</span>
              {getStatusBadge('rejected', data.statusSummary.rejected)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unverified</span>
              {getStatusBadge('unverified', data.statusSummary.unverified)}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Processing Time</span>
              <span className="text-xs font-mono">
                {data.metrics.averageProcessingDays.toFixed(1)} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Recent Submissions (7d)</span>
              <span className="text-xs font-mono flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                {data.metrics.recentSubmissionCount}
              </span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-600">Needs Urgent Review</span>
                <span className="text-xs font-mono text-orange-600">
                  {urgentCount} submissions
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
