
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Smartphone, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import MpesaForm from '@/components/mpesa-form'
import Link from 'next/link'

interface MpesaData {
  mpesaPhoneNumber: string | null
  mpesaVerified: boolean
}

export default function MpesaManagementPage() {
  const { data: session, status } = useSession()
  const [mpesaData, setMpesaData] = useState<MpesaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'TALENT') {
      redirect('/unauthorized')
    }

    fetchMpesaData()
  }, [session, status])

  const fetchMpesaData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/mpesa')
      
      if (!response.ok) {
        throw new Error('Failed to fetch M-Pesa data')
      }

      const data = await response.json()
      if (data.success) {
        setMpesaData(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch M-Pesa data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMpesaUpdate = () => {
    fetchMpesaData() // Refresh data after update
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading M-Pesa details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchMpesaData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/talent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">M-Pesa Payout Setup</h1>
        <p className="text-muted-foreground">
          Configure your M-Pesa number to receive payments directly to your phone
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Current M-Pesa Status
          </CardTitle>
          <CardDescription>
            Your current payout configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Phone Number</span>
              <div className="text-right">
                {mpesaData?.mpesaPhoneNumber ? (
                  <div className="font-mono text-sm">
                    {mpesaData.mpesaPhoneNumber}
                  </div>
                ) : (
                  <Badge variant="outline">Not Set</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Status</span>
              <div>
                {mpesaData?.mpesaPhoneNumber ? (
                  mpesaData.mpesaVerified ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Verification
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline">Not Applicable</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payout Status</span>
              <div>
                {mpesaData?.mpesaPhoneNumber ? (
                  <Badge variant="default" className="bg-calm-soft-blue/20 text-blue-800">
                    Ready for Payouts
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Setup Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* M-Pesa Form */}
      <div className="flex justify-center">
        <MpesaForm
          currentPhoneNumber={mpesaData?.mpesaPhoneNumber || undefined}
          onUpdate={handleMpesaUpdate}
        />
      </div>

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Payouts Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Payouts are processed after booking completion</p>
            <p>• You receive 90% of the booking amount</p>
            <p>• 10% platform fee is deducted automatically</p>
            <p>• Payments are sent directly to your M-Pesa</p>
            <p>• Processing usually takes 1-2 business days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Your M-Pesa number is encrypted and secure</p>
            <p>• Only used for legitimate payout purposes</p>
            <p>• Never shared with third parties</p>
            <p>• You can update it anytime</p>
            <p>• All transactions are logged and audited</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
