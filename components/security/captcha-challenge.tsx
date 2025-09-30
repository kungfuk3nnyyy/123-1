
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface CaptchaData {
  sessionId: string
  question: string
  expiresAt: string
}

interface CaptchaChallengeProps {
  onValidation?: (isValid: boolean, sessionId?: string) => void
  className?: string
}

/**
 * Visible CAPTCHA challenge (Layer 2 Security)
 * Shows only when user exhibits suspicious behavior
 */
export function CaptchaChallenge({ onValidation, className }: CaptchaChallengeProps) {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [isValidated, setIsValidated] = useState(false)

  // Generate initial CAPTCHA
  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch('/api/auth/captcha/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        setCaptchaData(result.data)
        setUserAnswer('')
        setIsValidated(false)
      } else {
        setError(result.error || 'Failed to generate CAPTCHA')
      }

    } catch (error) {
      console.error('Error generating CAPTCHA:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCaptcha = async () => {
    try {
      setIsRefreshing(true)
      setError('')
      
      const response = await fetch('/api/auth/captcha/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldSessionId: captchaData?.sessionId
        })
      })

      const result = await response.json()

      if (result.success) {
        setCaptchaData(result.data)
        setUserAnswer('')
        setIsValidated(false)
        toast.success('CAPTCHA refreshed')
      } else {
        setError(result.error || 'Failed to refresh CAPTCHA')
        toast.error('Failed to refresh CAPTCHA')
      }

    } catch (error) {
      console.error('Error refreshing CAPTCHA:', error)
      setError('Network error. Please try again.')
      toast.error('Network error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const validateCaptcha = async () => {
    if (!captchaData || !userAnswer.trim()) {
      setError('Please enter the CAPTCHA text')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/captcha/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: captchaData.sessionId,
          answer: userAnswer.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        if (result.isValid) {
          setIsValidated(true)
          toast.success('CAPTCHA validated successfully')
          if (onValidation) {
            onValidation(true, captchaData.sessionId)
          }
        } else {
          setError(result.reason || 'Incorrect CAPTCHA. Please try again.')
          // Generate new CAPTCHA on failed validation
          setTimeout(() => generateCaptcha(), 1000)
          if (onValidation) {
            onValidation(false)
          }
        }
      } else {
        setError(result.error || 'CAPTCHA validation failed')
        if (onValidation) {
          onValidation(false)
        }
      }

    } catch (error) {
      console.error('Error validating CAPTCHA:', error)
      setError('Network error. Please try again.')
      if (onValidation) {
        onValidation(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value)
    setError('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      validateCaptcha()
    }
  }

  if (!captchaData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-blue-800">Loading security verification...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Security Notice */}
      <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Shield className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-800">
          Security verification required. Please complete the CAPTCHA below.
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {isValidated && (
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            CAPTCHA verified successfully! You may now proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* CAPTCHA Display */}
      <div className="space-y-3">
        <Label htmlFor="captcha-answer" className="text-sm font-medium">
          Please solve the math problem below:
        </Label>
        
        <div className="flex items-center space-x-3">
          {/* Math Question */}
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white flex-shrink-0 min-w-[200px]">
            <div className="text-lg font-semibold text-center text-gray-800">
              {captchaData.question}
            </div>
          </div>
          
          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refreshCaptcha}
            disabled={isRefreshing || isLoading}
            className="flex-shrink-0"
            title="Get a new question"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Answer Input */}
        <div className="flex space-x-2">
          <Input
            id="captcha-answer"
            type="number"
            value={userAnswer}
            onChange={handleAnswerChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter your answer"
            disabled={isLoading || isValidated}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="button"
            onClick={validateCaptcha}
            disabled={isLoading || !userAnswer.trim() || isValidated}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Verify
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hidden field to store validated session ID */}
      {isValidated && (
        <input
          type="hidden"
          name="captchaSessionId"
          value={captchaData.sessionId}
        />
      )}
    </div>
  )
}
