

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { 
  AlertTriangle, 
  Eye, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { DisputeStatus } from '@prisma/client'
import { DISPUTE_STATUS_LABELS, DISPUTE_REASON_LABELS } from '@/lib/types'
import type { Dispute } from '@prisma/client'

interface FormattedDispute {
  id: string
  bookingId: string | null
  eventTitle: string
  eventLocation: string
  eventDate: Date | null
  organizerName: string
  organizerEmail: string
  talentName: string
  talentEmail: string
  disputedBy: {
    name: string
    email: string
    role: string
  }
  reason: string
  explanation: string
  status: DisputeStatus
  amount: number
  createdAt: string
  resolvedAt: string | null
  resolutionNotes: string | null
  refundAmount: number | null
  payoutAmount: number | null
}

interface DisputesPageData {
  disputes: FormattedDispute[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function DisputesPage() {
  const router = useRouter()
  const [data, setData] = useState<DisputesPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchDisputes = async (page = 1, status?: DisputeStatus | 'all') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (status && status !== 'all') {
        params.set('status', status)
      }

      const response = await fetch(`/api/admin/disputes?${params}`)
      const result = await response.json()

      if (result.success) {
        setData({
          disputes: result.data.disputes,
          pagination: {
            currentPage: result.data.pagination.currentPage,
            totalPages: result.data.pagination.totalPages,
            totalCount: result.data.pagination.totalItems,
            hasNext: result.data.pagination.currentPage < result.data.pagination.totalPages,
            hasPrev: result.data.pagination.currentPage > 1
          }
        })
      } else {
        toast.error('Failed to fetch disputes')
      }
    } catch (error) {
      console.error('Error fetching disputes:', error)
      toast.error('Failed to fetch disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes(currentPage, statusFilter)
  }, [currentPage, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleStatusFilter = (status: DisputeStatus | 'all') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleViewDispute = (disputeId: string) => {
    router.push(`/admin/disputes/${disputeId}`)
  }

  const getStatusBadge = (status: DisputeStatus) => {
    const statusConfig = {
      [DisputeStatus.OPEN]: { variant: 'destructive' as const, icon: AlertTriangle },
      [DisputeStatus.UNDER_REVIEW]: { variant: 'secondary' as const, icon: Clock },
      [DisputeStatus.RESOLVED_ORGANIZER_FAVOR]: { variant: 'outline' as const, icon: CheckCircle },
      [DisputeStatus.RESOLVED_TALENT_FAVOR]: { variant: 'outline' as const, icon: CheckCircle },
      [DisputeStatus.RESOLVED_PARTIAL]: { variant: 'outline' as const, icon: CheckCircle }
    }

    const config = statusConfig[status]
    const Icon = config?.icon || AlertTriangle

    return (
      <Badge variant={config?.variant || 'secondary'}>
        <Icon className="h-3 w-3 mr-1" />
        {DISPUTE_STATUS_LABELS[status as keyof typeof DISPUTE_STATUS_LABELS]}
      </Badge>
    )
  }

  const filteredDisputes = data?.disputes?.filter((dispute: FormattedDispute) =>
    searchTerm === '' || 
    dispute.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.disputedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.talentName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dispute Management</h1>
        </div>
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading disputes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispute Management</h1>
          <p className="text-muted-foreground">
            Manage and resolve booking disputes between organizers and talents
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Disputes</p>
              <p className="text-2xl font-bold">
                {data?.disputes?.filter((d: FormattedDispute) => d.status === DisputeStatus.OPEN).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Under Review</p>
              <p className="text-2xl font-bold">
                {data?.disputes?.filter((d: FormattedDispute) => d.status === DisputeStatus.UNDER_REVIEW).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Disputes</p>
              <p className="text-2xl font-bold">{data?.pagination?.totalCount || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by event, organizer, or talent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(DisputeStatus).map((status: DisputeStatus) => (
                  <SelectItem key={status} value={status}>
                    {DISPUTE_STATUS_LABELS[status as keyof typeof DISPUTE_STATUS_LABELS]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Disputed By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {searchTerm ? 'No disputes match your search' : 'No disputes found'}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Try adjusting your search criteria.' : 'There are currently no disputes to review.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDisputes.map((dispute: FormattedDispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{dispute.eventTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {dispute.eventLocation}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{dispute.disputedBy?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dispute.disputedBy?.role?.charAt(0) + dispute.disputedBy?.role?.slice(1).toLowerCase()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {DISPUTE_REASON_LABELS[dispute.reason as keyof typeof DISPUTE_REASON_LABELS]}
                      </p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(dispute.status)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(dispute.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        KES {dispute.amount?.toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDispute(dispute.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((data.pagination.currentPage - 1) * 10) + 1} to {Math.min(data.pagination.currentPage * 10, data.pagination.totalCount)} of {data.pagination.totalCount} disputes
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.pagination.currentPage - 1)}
              disabled={!data.pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.pagination.currentPage + 1)}
              disabled={!data.pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
