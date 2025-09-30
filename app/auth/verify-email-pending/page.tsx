
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { GigSecureLogo } from '@/components/gigsecure-logo'

function VerifyEmailPendingContent() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [email, setEmail] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage('Verification email sent successfully! Please check your email.')
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <GigSecureLogo size="lg" variant="default" className="mx-auto mb-6" />
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Please Verify Your Email
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p className="mb-4">
              We've sent a verification email to:
            </p>
            <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg break-all">
              {email || 'your email address'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Next Steps:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your email inbox</li>
                  <li>Look for an email from GigSecure</li>
                  <li>Click the verification link</li>
                  <li>Return here to log in</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Didn't receive the email? Check your spam folder or:
            </p>
            
            <Button
              onClick={handleResendVerification}
              disabled={isResending || !email}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            {resendMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                resendMessage.includes('successfully') 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {resendMessage}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPending() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailPendingContent />
    </Suspense>
  )
}
