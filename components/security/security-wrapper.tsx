
'use client'

import React from 'react'
import { HoneypotFields } from './honeypot-fields'
import { useSecurity } from '@/hooks/use-security'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Loader2 } from 'lucide-react'

interface SecurityWrapperProps {
  children: React.ReactNode
  onSecurityValidation?: (data: {
    honeypotTriggered: boolean
    formStartTime: number
  }) => void
}

/**
 * Wrapper component that handles both security layers
 */
export function SecurityWrapper({ children, onSecurityValidation }: SecurityWrapperProps) {
  const { isLoading, error } = useSecurity()

  const [honeypotData, setHoneypotData] = React.useState<Record<string, string>>({})

  const handleHoneypotChange = (field: string, value: string) => {
    setHoneypotData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Trigger security validation immediately since no CAPTCHA is needed
    if (onSecurityValidation) {
      onSecurityValidation({
        honeypotTriggered: Object.values({...honeypotData, [field]: value}).some(val => val.trim() !== ''),
        formStartTime: Date.now()
      })
    }
  }

  // Show loading state while checking security
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-800">Checking security status...</span>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Security check encountered an issue, but you can still proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Invisible Honeypot Fields (always present) */}
      <HoneypotFields onChange={handleHoneypotChange} />

      {/* Form Content - no restrictions since CAPTCHA is disabled */}
      <div>
        {children}
      </div>
    </div>
  )
}
