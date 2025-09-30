
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { GigSecureLogo } from '@/components/gigsecure-logo'

function VerificationSuccessContent() {
  const searchParams = useSearchParams()
  const alreadyVerified = searchParams?.get('already-verified') === 'true'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <GigSecureLogo size="lg" variant="default" className="mx-auto mb-6" />
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {alreadyVerified ? 'Already Verified!' : 'Email Verified Successfully!'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p className="mb-4">
              {alreadyVerified 
                ? 'Your email address has already been verified. You can now log in to your account.'
                : 'Great! Your email address has been verified successfully. You can now access all features of GigSecure.'
              }
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-2">What's Next?</p>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                    Log in to your account
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                    Complete your profile setup
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                    {alreadyVerified ? 'Continue using GigSecure' : 'Start exploring talent packages'}
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                    Join Kenya's event community
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                Proceed to Login
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Explore GigSecure
              </Button>
            </Link>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Welcome to GigSecure - Kenya's Premier Event Talent Platform</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerificationSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerificationSuccessContent />
    </Suspense>
  )
}
