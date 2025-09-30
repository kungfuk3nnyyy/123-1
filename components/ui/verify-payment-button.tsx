'use client'

import { useState } from 'react'

interface VerifyPaymentButtonProps {
  bookingId: string
  onVerified?: () => void
  className?: string
}

export function VerifyPaymentButton({ 
  bookingId, 
  onVerified,
  className 
}: VerifyPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const verifyPayment = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/organizer/bookings/${bookingId}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify payment')
      }

      if (data.status === 'completed') {
        setIsVerified(true)
        alert('✅ Payment verified successfully!')
        onVerified?.()
      } else {
        alert('🔄 Payment is still processing. Please try again in a moment.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to verify payment'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={verifyPayment}
      disabled={isLoading || isVerified}
      className={`px-4 py-2 rounded-md ${isVerified ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'} ${className || ''} flex items-center`}
    >
      {isLoading ? (
        <span className="animate-spin mr-2">🔄</span>
      ) : isVerified ? (
        <span className="mr-2">✅</span>
      ) : (
        <span className="mr-2">🔍</span>
      )}
      {isLoading ? 'Verifying...' : isVerified ? 'Payment Verified' : 'Verify Payment'}
    </button>
  )
}
