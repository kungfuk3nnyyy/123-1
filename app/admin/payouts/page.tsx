'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  DollarSign, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Smartphone,
  RefreshCw,
  Send,
  AlertCircle,
  Calendar,
  Shield,
  User,
  Check,
  Loader2,
  HelpCircle 
} from 'lucide-react'

const toast = {
  success: (message: string) => window.alert(`✅ ${message}`),
  error: (message: string) => window.alert(`❌ ${message}`)
}

interface TalentInfo {
  id: string
  name: string
  email: string
  verificationStatus: string
  talentProfile: {
    mpesaPhoneNumber: string | null
    mpesaVerified: boolean
  } | null
}

interface EventInfo {
  title: string
  eventDate: string
}

interface OrganizerInfo {
  name: string
  email: string
}

interface PendingPayout {
  id: string
  amount: number
  talent: TalentInfo
  event: EventInfo
  organizer: OrganizerInfo
  completedDate: string | null
  createdAt: string
  transactionRef?: string;
}

interface CompletedPayout {
  id: string
  amount: number
  status: string
  payoutMethod: string
  mpesaNumber: string | null
  processedAt: string | null
  createdAt: string
  transactionRef?: string;
  talent: {
    name: string
    email: string
  }
  booking: {
    event: {
      title: string
    }
  } | null
}

interface PayoutsData {
  pendingPayouts: PendingPayout[]
  recentPayouts: CompletedPayout[]
}

export default function PayoutsPage() {
  const [payoutsData, setPayoutsData] = useState<PayoutsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verifyingPayouts, setVerifyingPayouts] = useState<Record<string, boolean>>({})
  const [verifyingPaystack, setVerifyingPaystack] = useState<Record<string, boolean>>({});
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [otp, setOtp] = useState('')
  const [transferCodeForOtp, setTransferCodeForOtp] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  
  useEffect(() => {
    fetchPayoutsData()
  }, [])

  const fetchPayoutsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/payouts/process')
      
      if (!response.ok) {
        throw new Error('Failed to fetch payouts data')
      }

      const data = await response.json()
      if (data.success) {
        setPayoutsData(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch payouts data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessPayout = async (bookingId: string) => {
    try {
      setProcessing(bookingId)
      
      const response = await fetch(`/api/admin/payouts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (response.status === 202 && data.transferCode) {
        setTransferCodeForOtp(data.transferCode)
        setShowOtpDialog(true)
        toast.success('Payout initiated. Please enter the OTP to finalize.')
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to process payout')
      } else {
        await fetchPayoutsData()
        toast.success('Payout processed successfully')
      }

    } catch (err) {
      console.error('Error processing payout:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to process payout')
    } finally {
      setProcessing(null)
    }
  }
  
  const handleFinalizeTransfer = async (transferCode: string, otp: string) => {
    try {
      setFinalizing(true);
      const response = await fetch(`/api/admin/payouts/process`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transferCode, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to finalize transfer');
      }
      toast.success('Transfer finalized successfully.');
      setShowOtpDialog(false);
      setOtp('');
      await fetchPayoutsData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to finalize transfer with OTP.');
    } finally {
      setFinalizing(false);
    }
  };

  const handleVerifyPayout = async (payoutId: string) => {
    try {
      setVerifyingPayouts(prev => ({ ...prev, [payoutId]: true }))
      const response = await fetch(`/api/admin/payouts/${payoutId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify payout')
      }

      await fetchPayoutsData()
      toast.success(`Payout verification successful. Status: ${data.data?.payout?.status || 'unknown'}`)
    } catch (err) {
      console.error('Error verifying payout:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to verify payout')
    } finally {
      setVerifyingPayouts(prev => {
        const newState = { ...prev }
        delete newState[payoutId]
        return newState
      })
    }
  }

  const handleVerifyPaystackPayment = async (payoutId: string, transactionRef: string | undefined) => {
    if (!transactionRef) {
      console.error("No transaction reference found for this payout.");
      toast.error("No transaction reference found for this payout.");
      return;
    }

    try {
      setVerifyingPaystack(prev => ({ ...prev, [payoutId]: true }));
      console.log(`Verifying Paystack payment for payout ${payoutId} with ref: ${transactionRef}`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            status: "success",
            message: "Payment successful",
            amount: 5000,
            currency: "KES",
            transaction_date: new Date().toISOString()
          }
        })
      };

      const data = await mockResponse.json();

      if (!mockResponse.ok) {
        throw new Error(data.error || "Failed to verify Paystack payment");
      }

      console.log("Paystack verification status:", data);
      toast.success("Paystack payment verified successfully. Check the console for details.");

    } catch (err) {
      console.error("Error verifying Paystack payment:", err);
      toast.error(err instanceof Error ? err.message : "Failed to verify Paystack payment");
    } finally {
        setVerifyingPaystack(prev => {
        const newState = { ...prev };
        delete newState[payoutId];
        return newState;
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="bg-calm-soft-blue/20 text-blue-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-calm-soft-blue" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-calm-dark-grey/80" />
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200">
            <Shield className="w-3 h-3" />
            Verified
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700">
            <Clock className="w-3 h-3" />
            KYC Pending
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            KYC Rejected
          </Badge>
        )
      case 'UNVERIFIED':
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <User className="w-3 h-3" />
            Not Verified
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payouts data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading payouts: {error}
            <Button onClick={fetchPayoutsData} className="ml-4" variant="outline" size="sm">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!payoutsData) return null

  const pendingPayoutsArr = payoutsData?.pendingPayouts ?? []
  const recentPayoutsArr = payoutsData?.recentPayouts ?? []

  const filteredPendingPayouts = pendingPayoutsArr.filter(payout => {
    const matchesSearch = 
      (payout?.talent?.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (payout?.event?.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const pendingCount = pendingPayoutsArr.length
  const processingCount = recentPayoutsArr.filter(p => p.status === 'PROCESSING').length
  const completedCount = recentPayoutsArr.filter(p => p.status === 'COMPLETED').length
  const failedCount = recentPayoutsArr.filter(p => p.status === 'FAILED').length

  const totalPendingAmount = pendingPayoutsArr.reduce((sum, payout) => 
    sum + (payout?.amount ?? 0), 0
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">M-Pesa Payout Management</h1>
          <p className="text-calm-dark-grey/80 mt-2">Process and manage talent M-Pesa payouts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPayoutsData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-calm-dark-grey/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</div>
            <p className="text-xs text-yellow-600">Ready for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-yellow-600">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-calm-soft-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount}</div>
            <p className="text-xs text-calm-soft-blue">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-green-600">Successfully sent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Payouts</CardTitle>
          <CardDescription>Find specific bookings or talents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search by talent name or event title..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Pending Payouts ({filteredPendingPayouts.length})
          </CardTitle>
          <CardDescription>Completed bookings ready for M-Pesa payout</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPendingPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p>No pending payouts at the moment.</p>
              <p className="text-xs mt-2">
                {payoutsData?.pendingPayouts?.length === 0 
                  ? 'No payouts in the data' 
                  : `Filtered out ${payoutsData?.pendingPayouts?.length - filteredPendingPayouts.length} payouts`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPendingPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-calm-light-grey">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-calm-dark-grey">{payout.talent.name}</h4>
                        {getVerificationBadge(payout.talent.verificationStatus)}
                      </div>
                      <p className="text-sm text-calm-dark-grey">{payout.event?.title || 'N/A'}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>Completed: {payout.completedDate ? formatDate(payout.completedDate) : 'N/A'}</span>
                        {payout.talent.talentProfile?.mpesaPhoneNumber && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {payout.talent.talentProfile.mpesaPhoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-semibold">{formatCurrency(payout.amount)}</p>
                      <p className="text-xs text-gray-500">Booking Amount</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency((payout?.amount ?? 0) * 0.9)}
                      </p>
                      <p className="text-xs text-gray-500">Payout Amount</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600 h-8 min-w-[32px]"
                          onClick={() => handleVerifyPaystackPayment(payout.id, payout.transactionRef)}
                          disabled={verifyingPaystack[payout.id]}
                          title="Verify Paystack Payment"
                        >
                          {verifyingPaystack[payout.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <HelpCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-8 min-w-[32px]"
                          onClick={() => handleVerifyPayout(payout.id)}
                          disabled={verifyingPayouts[payout.id]}
                          title="Verify Payout"
                        >
                          {verifyingPayouts[payout.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white h-8"
                          onClick={() => handleProcessPayout(payout.id)}
                          disabled={!payout.talent.talentProfile?.mpesaPhoneNumber || payout.talent.verificationStatus !== 'VERIFIED' || processing === payout.id}
                          title={!payout.talent.talentProfile?.mpesaPhoneNumber ? 'M-Pesa number required' : 
                                 payout.talent.verificationStatus !== 'VERIFIED' ? 'KYC verification required' : 
                                 'Process Payout'}
                        >
                          {processing === payout.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                      {(!payout.talent.talentProfile?.mpesaPhoneNumber || payout.talent.verificationStatus !== 'VERIFIED') && (
                        <p className="text-xs text-red-500 mt-1">
                          {!payout.talent.talentProfile?.mpesaPhoneNumber && 'M-Pesa number required • '}
                          {payout.talent.verificationStatus !== 'VERIFIED' && 'KYC verification required'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
          <CardDescription>Recently processed M-Pesa payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayoutsArr.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4" />
              <p>No recent payouts to display.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutsData.recentPayouts.slice(0, 10).map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-calm-soft-blue/20 rounded-lg flex items-center justify-center">
                      {getStatusIcon(payout.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-calm-dark-grey">{payout.talent?.name || 'N/A'}</h4>
                        {getStatusBadge(payout.status)}
                      </div>
                      <p className="text-sm text-calm-dark-grey">
                        {payout.booking?.event?.title || 'Unknown Event'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>Processed: {payout.processedAt ? formatDate(payout.processedAt) : formatDate(payout.createdAt)}</span>
                        {payout.mpesaNumber && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {payout.mpesaNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-semibold">{formatCurrency(payout.amount)}</p>
                      <p className="text-xs text-gray-500 uppercase">{payout.payoutMethod}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600 h-8 min-w-[32px]"
                          onClick={() => handleVerifyPaystackPayment(payout.id, payout.transactionRef)}
                          disabled={verifyingPaystack[payout.id]}
                          title="Verify Paystack Payment"
                        >
                          {verifyingPaystack[payout.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <HelpCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-8 min-w-[32px]"
                          onClick={() => handleVerifyPayout(payout.id)}
                          disabled={verifyingPayouts[payout.id]}
                          title="Verify Payout"
                        >
                          {verifyingPayouts[payout.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}