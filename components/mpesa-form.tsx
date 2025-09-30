
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { UserRole } from '@prisma/client'

interface MpesaFormProps {
  currentPhoneNumber?: string
  onUpdate?: () => void
}

export default function MpesaForm({ currentPhoneNumber, onUpdate }: MpesaFormProps) {
  const { data: session } = useSession()
  const [phoneNumber, setPhoneNumber] = useState(currentPhoneNumber || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Handle different input formats
    if (digits.startsWith('254')) {
      return digits
    } else if (digits.startsWith('0')) {
      return '254' + digits.slice(1)
    } else if (digits.startsWith('7') || digits.startsWith('1')) {
      return '254' + digits
    }
    
    return digits
  }

  const validatePhoneNumber = (phone: string) => {
    const formatted = formatPhoneNumber(phone)
    // Kenyan phone numbers: 254XXXXXXXX (12 digits total)
    // Starting with 254 and followed by 9 digits (7, 1, or other valid prefixes)
    return /^254[0-9]{9}$/.test(formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhoneNumber(value)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('https://dooonda.co.ke/api/talent/profile', {
        method: 'PATCH',
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'referer': 'https://dooonda.co.ke/talent/mpesa'
        },
        credentials: 'include', // This will include cookies
        body: JSON.stringify({
          mpesaPhoneNumber: formattedPhone,
          phoneNumber: formattedPhone  // Also update the phoneNumber field with the same value
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update phone number')
      }

      // Update the local state with the formatted phone number
      setPhoneNumber(formattedPhone)
      setSuccess('M-Pesa phone number updated successfully!')
      
      // Call the onUpdate callback if provided
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (session?.user?.role !== UserRole.TALENT) {
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-600" />
          M-Pesa Payout Details
        </CardTitle>
        <CardDescription>
          Add your M-Pesa phone number to receive instant payouts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              M-Pesa Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="e.g., 0712345678 or 254712345678"
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your Safaricom number registered for M-Pesa
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                {currentPhoneNumber ? 'Update' : 'Add'} M-Pesa Number
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Why we need this:</p>
              <p>Your M-Pesa number will be used for instant payout transfers when bookings are completed. We ensure secure handling of your payment information.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
