
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, RefreshCw, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { GigSecureLogo } from '@/components/gigsecure-logo'

function VerificationErrorContent() {
  const [reason, setReason] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const reasonParam = searchParams?.get('reason')
    if (reasonParam) {
      setReason(reasonParam)
    }
  }, [searchParams])

  const getErrorInfo = () => {
    switch (reason) {
      case 'missing-token':
        return {
          title: 'Invalid Verification Link',
          message: 'The verification link is missing required information. Please use the complete link from your email.',
          canResend: true
        }
      case 'invalid-token':
        return {
          title: 'Invalid Verification Token',
          message: 'This verification link is invalid or has already been used. Please request a new verification email.',
          canResend: true
        }
      case 'expired-token':
        return {
          title: 'Verification Link Expired',
          message: 'This verification link has expired. Please request a new verification email to continue.',
          canResend: true
        }
      case 'server-error':
        return {
          title: 'Server Error',
          message: 'We encountered an error while verifying your email. Please try again or contact support.',
          canResend: true
        }
      default:
        return {
          title: 'Verification Failed',
          message: 'We couldn\'t verify your email address. Please try again or contact support.',
          canResend: true
        }
    }
  }

  const errorInfo = getErrorInfo()

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setResendMessage('Please enter your email address.')
      return
    }

    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage('New verification email sent successfully! Please check your email.')
      } else {
        setResendMessage(data.error || 'Failed to resend verification email. Please try again.')
      }
    } catch (error) {
      setResendMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <GigSecureLogo size="lg" variant="default" className="mx-auto mb-6" />
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p>{errorInfo.message}</p>
          </div>

          {errorInfo.canResend && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Request New Verification Email
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      disabled={isResending}
                    />
                  </div>
                  
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending || !email.trim()}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Send New Verification Email
                      </>
                    )}
                  </Button>

                  {resendMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      resendMessage.includes('successfully') 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {resendMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
            
            <Link href="/auth/signup">
              <Button variant="ghost" className="w-full">
                Create New Account
              </Button>
            </Link>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Need help? Contact our support team for assistance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerificationError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerificationErrorContent />
    </Suspense>
  )
}
