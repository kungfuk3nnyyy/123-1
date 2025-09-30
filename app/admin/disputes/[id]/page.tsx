

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { 
  ArrowLeft,
  AlertTriangle, 
  Clock,
  CheckCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  MessageCircle,
  Star,
  Gavel
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { DisputeStatus, UserRole } from '@prisma/client'
import { DISPUTE_STATUS_LABELS, DISPUTE_REASON_LABELS } from '@/lib/types'
import type { Dispute } from '@prisma/client'

interface DisputeDetailPageProps {
  params: { id: string }
}

interface ResolutionFormData {
  resolution: 'organizer_favor' | 'talent_favor' | 'partial_resolution' | ''
  resolutionNotes: string
  refundAmount: string
  payoutAmount: string
}

interface TransformedDispute extends Dispute {
  booking?: {
    id: string
    amount: any
    talentAmount: any
    event?: {
      title: string
      eventDate: Date
      location: string
    }
    organizer?: {
      id: string
      name: string
      email: string
    }
    talent?: {
      id: string
      name: string
      email: string
      talentProfile?: {
        averageRating: any
      }
    }
    messages?: any[]
    transactions?: any[]
    reviews?: any[]
  }
  disputedBy?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function DisputeDetailPage({ params }: DisputeDetailPageProps) {
  const router = useRouter()
  const [dispute, setDispute] = useState<TransformedDispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [isResolving, setIsResolving] = useState(false)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [resolutionForm, setResolutionForm] = useState<ResolutionFormData>({
    resolution: '',
    resolutionNotes: '',
    refundAmount: '',
    payoutAmount: ''
  })

  const fetchDispute = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/disputes/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setDispute(result.data)
      } else {
        toast.error('Failed to fetch dispute details')
        router.push('/admin/disputes')
      }
    } catch (error) {
      console.error('Error fetching dispute:', error)
      toast.error('Failed to fetch dispute details')
      router.push('/admin/disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispute()
  }, [params.id])

  const handleResolutionSubmit = async () => {
    if (!resolutionForm.resolution || !resolutionForm.resolutionNotes.trim()) {
      toast.error('Please select a resolution type and provide notes')
      return
    }

    if (resolutionForm.resolution === 'partial_resolution') {
      const refund = parseFloat(resolutionForm.refundAmount || '0')
      const payout = parseFloat(resolutionForm.payoutAmount || '0')
      const totalAmount = parseFloat(dispute?.booking?.amount?.toString() || '0')

      if (refund + payout > totalAmount) {
        toast.error('Total refund and payout cannot exceed booking amount')
        return
      }
    }

    setIsResolving(true)

    try {
      const payload: any = {
        resolution: resolutionForm.resolution,
        resolutionNotes: resolutionForm.resolutionNotes.trim()
      }

      if (resolutionForm.resolution === 'partial_resolution') {
        payload.refundAmount = parseFloat(resolutionForm.refundAmount || '0')
        payload.payoutAmount = parseFloat(resolutionForm.payoutAmount || '0')
      }

      const response = await fetch(`/api/admin/disputes/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Dispute resolved successfully')
        setShowResolutionModal(false)
        fetchDispute() // Refresh dispute data
      } else {
        toast.error(result.error || 'Failed to resolve dispute')
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast.error('Failed to resolve dispute')
    } finally {
      setIsResolving(false)
    }
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

  const isResolved = dispute?.status && (
    dispute.status === DisputeStatus.RESOLVED_ORGANIZER_FAVOR ||
    dispute.status === DisputeStatus.RESOLVED_TALENT_FAVOR ||
    dispute.status === DisputeStatus.RESOLVED_PARTIAL
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/disputes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Disputes
            </Link>
          </Button>
        </div>
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading dispute details...</p>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/disputes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Disputes
            </Link>
          </Button>
        </div>
        <div className="text-center py-10">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Dispute not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/disputes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Disputes
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Dispute Details</h1>
            <p className="text-muted-foreground">
              Created {format(new Date(dispute.createdAt), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(dispute.status)}
          {!isResolved && (
            <Button onClick={() => setShowResolutionModal(true)}>
              <Gavel className="h-4 w-4 mr-2" />
              Resolve Dispute
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Dispute Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Dispute Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {DISPUTE_REASON_LABELS[dispute.reason as keyof typeof DISPUTE_REASON_LABELS]}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Explanation</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{dispute.explanation}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Disputed By</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dispute.disputedBy?.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {dispute.disputedBy?.role ? dispute.disputedBy.role.charAt(0) + dispute.disputedBy.role.slice(1).toLowerCase() : 'Unknown'}
                  </Badge>
                </div>
              </div>

              {isResolved && dispute.resolutionNotes && (
                <div>
                  <Label className="text-sm font-medium text-green-700">Admin Resolution</Label>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 whitespace-pre-wrap">
                      {dispute.resolutionNotes}
                    </p>
                    {dispute.resolvedAt && (
                      <p className="text-xs text-green-600 mt-2">
                        Resolved on {format(new Date(dispute.resolvedAt), 'MMMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Message History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dispute.booking?.messages?.length ? (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {dispute.booking.messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.sender?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages found for this booking
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Booking Details */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Event</Label>
                <p className="text-sm">{dispute.booking?.event?.title}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {dispute.booking?.event?.eventDate 
                    ? format(new Date(dispute.booking.event.eventDate), 'MMMM dd, yyyy')
                    : 'Date not set'
                  }
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{dispute.booking?.event?.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  KES {dispute.booking?.amount?.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Parties Involved */}
          <Card>
            <CardHeader>
              <CardTitle>Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Organizer</Label>
                <div className="mt-1">
                  <p className="text-sm">{dispute.booking?.organizer?.name}</p>
                  <p className="text-xs text-muted-foreground">{dispute.booking?.organizer?.email}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Talent</Label>
                <div className="mt-1">
                  <p className="text-sm">{dispute.booking?.talent?.name}</p>
                  <p className="text-xs text-muted-foreground">{dispute.booking?.talent?.email}</p>
                  {dispute.booking?.talent?.talentProfile?.averageRating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">
                        {parseFloat(dispute.booking.talent.talentProfile.averageRating.toString()).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          {isResolved && (dispute.refundAmount || dispute.payoutAmount) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Resolution Amounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dispute.refundAmount && Number(dispute.refundAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Organizer Refund</span>
                    <span className="text-sm font-medium">
                      KES {dispute.refundAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                {dispute.payoutAmount && Number(dispute.payoutAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Talent Payout</span>
                    <span className="text-sm font-medium">
                      KES {dispute.payoutAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      <Dialog open={showResolutionModal} onOpenChange={setShowResolutionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Choose how to resolve this dispute between the organizer and talent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Resolution Type</Label>
              <div className="space-y-3 mt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resolution"
                    value="organizer_favor"
                    checked={resolutionForm.resolution === 'organizer_favor'}
                    onChange={(e) => setResolutionForm(prev => ({ 
                      ...prev, 
                      resolution: e.target.value as any,
                      refundAmount: dispute?.booking?.amount?.toString() || '',
                      payoutAmount: '0'
                    }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">Rule in Favor of Organizer</div>
                    <div className="text-xs text-muted-foreground">Full refund to organizer</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resolution"
                    value="talent_favor"
                    checked={resolutionForm.resolution === 'talent_favor'}
                    onChange={(e) => setResolutionForm(prev => ({ 
                      ...prev, 
                      resolution: e.target.value as any,
                      refundAmount: '0',
                      payoutAmount: dispute?.booking?.talentAmount?.toString() || ''
                    }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">Rule in Favor of Talent</div>
                    <div className="text-xs text-muted-foreground">Full payout to talent</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resolution"
                    value="partial_resolution"
                    checked={resolutionForm.resolution === 'partial_resolution'}
                    onChange={(e) => setResolutionForm(prev => ({ 
                      ...prev, 
                      resolution: e.target.value as any,
                      refundAmount: '',
                      payoutAmount: ''
                    }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">Partial Resolution</div>
                    <div className="text-xs text-muted-foreground">Custom split between parties</div>
                  </div>
                </label>
              </div>
            </div>

            {resolutionForm.resolution === 'partial_resolution' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="refundAmount">Organizer Refund (KES)</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    placeholder="0"
                    value={resolutionForm.refundAmount}
                    onChange={(e) => setResolutionForm(prev => ({ 
                      ...prev, 
                      refundAmount: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="payoutAmount">Talent Payout (KES)</Label>
                  <Input
                    id="payoutAmount"
                    type="number"
                    placeholder="0"
                    value={resolutionForm.payoutAmount}
                    onChange={(e) => setResolutionForm(prev => ({ 
                      ...prev, 
                      payoutAmount: e.target.value 
                    }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="resolutionNotes">Resolution Notes</Label>
              <Textarea
                id="resolutionNotes"
                placeholder="Explain the reasoning behind this resolution..."
                value={resolutionForm.resolutionNotes}
                onChange={(e) => setResolutionForm(prev => ({ 
                  ...prev, 
                  resolutionNotes: e.target.value 
                }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolutionModal(false)}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolutionSubmit}
              disabled={isResolving || !resolutionForm.resolution || !resolutionForm.resolutionNotes.trim()}
            >
              {isResolving ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
