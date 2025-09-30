'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  XCircle
} from 'lucide-react'
import { TransactionStatus } from '@prisma/client'
import Link from 'next/link'

// This interface is a reference for the component's state.
// The actual data access will be adapted in the JSX to match the API response.
interface Transaction {
  id: string
  amount: string // API sends amount as a string
  status: TransactionStatus
  createdAt: string // API sends dates as strings
  updatedAt: string
  Booking?: {
    id: string
    amount: string
    platformFee: string
    Event: {
      title: string
      eventDate: string
    }
    User_Booking_organizerIdToUser: {
      name: string
      OrganizerProfile?: {
        companyName: string | null
      }
    }
  }
}

interface EarningsData {
  transactions: Transaction[]
  summary: {
    totalEarnings: number
    pendingPayouts: number
    completedPayouts: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TalentEarnings() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/talent/earnings')
      if (!response.ok) {
        throw new Error('Failed to fetch earnings')
      }
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch earnings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount)
  }

  const handleExport = () => {
    if (!data) return
    
    // Create CSV content
    const headers = ['Date', 'Event', 'Organizer', 'Amount', 'Status']
    const csvContent = [
      headers.join(','),
      ...data.transactions.map(transaction => [
        new Date(transaction.createdAt).toLocaleDateString(),
        transaction.Booking?.Event?.title || 'N/A',
        transaction.Booking?.User_Booking_organizerIdToUser?.name || 'N/A',
        transaction.amount,
        transaction.status
      ].join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig: Record<TransactionStatus, { variant: 'secondary' | 'default' | 'destructive' | 'outline', label: string, icon: any }> = {
      [TransactionStatus.PENDING]: { variant: 'secondary', label: 'Pending', icon: Clock },
      [TransactionStatus.COMPLETED]: { variant: 'default', label: 'Completed', icon: CheckCircle },
      [TransactionStatus.FAILED]: { variant: 'destructive', label: 'Failed', icon: AlertCircle },
      [TransactionStatus.CANCELLED]: { variant: 'destructive', label: 'Cancelled', icon: XCircle }
    }

    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
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
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading earnings: {error}</span>
            </div>
            <Button onClick={fetchEarnings} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Track your earnings and payout history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.pendingPayouts)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting transfer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.completedPayouts)}</div>
            <p className="text-xs text-muted-foreground">
              Successfully paid out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Detailed breakdown of your earnings and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.TALENT_EARNINGS.icon}
              title={EMPTY_STATES.TALENT_EARNINGS.title}
              description={EMPTY_STATES.TALENT_EARNINGS.description}
              size="md"
              action={{
                label: 'View Available Bookings',
                onClick: () => window.location.href = '/talent/bookings'
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead>Gross Amount</TableHead>
                    <TableHead>Platform Fee (10%)</TableHead>
                    <TableHead>Net Payout</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.Booking?.Event?.title || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {transaction.Booking?.User_Booking_organizerIdToUser?.OrganizerProfile?.companyName ||
                         transaction.Booking?.User_Booking_organizerIdToUser?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {transaction.Booking?.Event?.eventDate
                            ? new Date(transaction.Booking.Event.eventDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.Booking?.amount || 0)}</TableCell>
                      <TableCell className="text-red-600">
                        -{formatCurrency(transaction.Booking?.platformFee || 0)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            How Payouts Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Payouts are processed after booking completion and client confirmation</p>
          <p>• You receive 90% of the booking amount (10% platform fee is deducted)</p>
          <p>• Payments are sent directly to your registered M-Pesa number</p>
          <p>• Processing usually takes 1-2 business days</p>
          <p>• All transactions are tracked and can be disputed if needed</p>
        </CardContent>
      </Card>
    </div>
  )
}