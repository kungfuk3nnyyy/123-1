'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// @ts-ignore - sonner toast is not properly typed
// @ts-ignore - sonner toast is not properly typed
// @ts-ignore - sonner toast is not properly typed
import { toast } from 'sonner'

// Simple fallback icons
const IconWrapper = ({ children, ...props }: { children: React.ReactNode, className?: string }) => (
  <span {...props}>{children}</span>
);

// Fallback icon components
const CreditCard = (props: any) => <IconWrapper {...props}>💳</IconWrapper>;
const Search = (props: any) => <IconWrapper {...props}>🔍</IconWrapper>;
const Filter = (props: any) => <IconWrapper {...props}>⚙️</IconWrapper>;
const TrendingUp = (props: any) => <IconWrapper {...props}>📈</IconWrapper>;
const TrendingDown = (props: any) => <IconWrapper {...props}>📉</IconWrapper>;
const DollarSign = (props: any) => <IconWrapper {...props}>💲</IconWrapper>;
const Repeat = (props: any) => <IconWrapper {...props}>🔄</IconWrapper>;
const RefreshCw = (props: any) => <IconWrapper {...props}>🔄</IconWrapper>;
const Download = (props: any) => <IconWrapper {...props}>⬇️</IconWrapper>;
const Eye = (props: any) => <IconWrapper {...props}>👁️</IconWrapper>;
const Calendar = (props: any) => <IconWrapper {...props}>📅</IconWrapper>;

interface Transaction {
  id: string
  type: string
  user: string
  bookingId: string
  eventTitle: string
  amount: number
  status: string
  date: string
  paystackRef: string
  description: string
}

interface TransactionStats {
  totalVolume: number
  platformRevenue: number
  successfulTxns: number
  failedTxns: number
  successRate: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [viewDialog, setViewDialog] = useState(false)

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        type: typeFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/admin/transactions?${params}`)
      const data = await response.json()

      if (response.ok && data.success) {
        // Transform the API response to match our expected format
        const transactions = data.data.transactions.map((txn: any) => ({
          id: txn.id,
          type: txn.type,
          user: txn.user,
          bookingId: txn.bookingId,
          eventTitle: txn.eventTitle,
          amount: txn.amount,
          status: txn.status,
          date: txn.date,
          paystackRef: txn.paystackRef || '',
          description: txn.description || ''
        }))

        setTransactions(transactions)
        
        // Calculate stats from the transactions
        const totalVolume = transactions.reduce((sum: number, txn: any) => sum + txn.amount, 0)
        const successfulTxns = transactions.filter((txn: any) => txn.status === 'COMPLETED').length
        const failedTxns = transactions.filter((txn: any) => txn.status === 'FAILED').length
        const successRate = transactions.length > 0 ? (successfulTxns / transactions.length) * 100 : 0
        
        setStats({
          totalVolume,
          platformRevenue: totalVolume * 0.1, // 10% platform fee
          successfulTxns,
          failedTxns,
          successRate
        })

        // Set pagination
        if (data.data.pagination) {
          setPagination({
            total: data.data.pagination.totalItems,
            page: data.data.pagination.currentPage,
            limit: parseInt(data.data.pagination.itemsPerPage, 10),
            pages: data.data.pagination.totalPages
          })
        }
      } else {
        toast.error(data.error || 'Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Error loading transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(currentPage)
  }, [search, typeFilter, statusFilter, currentPage])

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_PAYMENT':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'TALENT_PAYOUT':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'PLATFORM_FEE':
        return <DollarSign className="h-4 w-4 text-calm-soft-blue" />
      case 'REFUND':
        return <Repeat className="h-4 w-4 text-orange-600" />
      default:
        return <CreditCard className="h-4 w-4 text-calm-dark-grey/80" />
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'BOOKING_PAYMENT':
        return <Badge className="bg-red-100 text-red-800">Payment In</Badge>
      case 'TALENT_PAYOUT':
        return <Badge className="bg-green-100 text-green-800">Payout</Badge>
      case 'PLATFORM_FEE':
        return <Badge className="bg-calm-soft-blue/20 text-blue-800">Platform Fee</Badge>
      case 'REFUND':
        return <Badge className="bg-orange-100 text-orange-800">Refund</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'cancelled':
        return <Badge className="bg-calm-light-grey text-calm-dark-grey">Cancelled</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">Transaction Management</h1>
          <p className="text-calm-dark-grey/80 mt-2">Monitor all financial transactions on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchTransactions(currentPage)}
            disabled={loading}
            className="border border-gray-300 bg-white hover:bg-gray-100"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Transactions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <CreditCard className="h-4 w-4 text-calm-dark-grey/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {stats?.totalVolume ? (stats.totalVolume / 1000000).toFixed(1) + 'M' : '0'}
            </div>
            <p className="text-xs text-green-600">Transaction volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-calm-soft-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {stats?.platformRevenue ? (stats.platformRevenue / 1000).toFixed(0) + 'K' : '0'}
            </div>
            <p className="text-xs text-calm-soft-blue">10% commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-green-600">{stats?.successfulTxns || 0} successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedTxns || 0}</div>
            <p className="text-xs text-red-600">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Transactions</CardTitle>
          <CardDescription>Find and filter transaction records with advanced options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search by transaction ID, user, or Paystack reference..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BOOKING_PAYMENT">Payment In</SelectItem>
                <SelectItem value="TALENT_PAYOUT">Payout</SelectItem>
                <SelectItem value="PLATFORM_FEE">Platform Fee</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={resetFilters}
              className="border border-gray-300 bg-white hover:bg-gray-100"
            >
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Complete financial audit log 
            {pagination && ` (${pagination.total} total, page ${pagination.page} of ${pagination.pages})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-calm-dark-grey/80">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-calm-light-grey">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-calm-light-grey rounded-lg flex items-center justify-center">
                      {getTransactionTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-calm-dark-grey">{transaction.id}</h4>
                        {getTransactionTypeBadge(transaction.type)}
                      </div>
                      <p className="text-sm text-calm-dark-grey/80 font-medium">{transaction.user}</p>
                      <p className="text-xs text-gray-500">
                        Booking: {transaction.bookingId} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-calm-dark-grey">KES {transaction.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Amount</p>
                    </div>
                    
                    <div className="text-center">
                      {getStatusBadge(transaction.status)}
                    </div>
                    
                    <div className="text-right min-w-24">
                      <p className="text-xs text-gray-500 font-mono break-all">{transaction.paystackRef}</p>
                      <p className="text-xs text-gray-400">Paystack Ref</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        className="px-3 py-1 text-sm"
                        onClick={() => {
                          setSelectedTransaction(transaction)
                          setViewDialog(true)
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {transaction.status.toLowerCase() === 'failed' && (
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => toast.info(`Retry functionality would be implemented for ${transaction.id}`)}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-calm-dark-grey/80">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
              </p>
              <div className="flex gap-2">
                <Button
                  className="px-3 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-100"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  className="px-3 py-1 text-sm border border-gray-300 bg-white hover:bg-gray-100"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Transaction Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details - {selectedTransaction?.id}</DialogTitle>
            <DialogDescription>Complete transaction information and audit trail</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-calm-dark-grey mb-2">Transaction Information</h4>
                  <p className="text-sm"><strong>ID:</strong> {selectedTransaction.id}</p>
                  <p className="text-sm"><strong>Amount:</strong> KES {selectedTransaction.amount.toLocaleString()}</p>
                  <p className="text-sm"><strong>Type:</strong> {selectedTransaction.type.replace('_', ' ')}</p>
                  <p className="text-sm"><strong>Date:</strong> {formatDate(selectedTransaction.date)}</p>
                  <p className="text-sm"><strong>Paystack Ref:</strong> {selectedTransaction.paystackRef}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-calm-dark-grey mb-2">Related Information</h4>
                  <p className="text-sm"><strong>User:</strong> {selectedTransaction.user}</p>
                  <p className="text-sm"><strong>Booking ID:</strong> {selectedTransaction.bookingId}</p>
                  <p className="text-sm"><strong>Event:</strong> {selectedTransaction.eventTitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  {getTransactionTypeBadge(selectedTransaction.type)}
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {formatDate(selectedTransaction.date)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
