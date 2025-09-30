
'use client'

import { useState, useEffect } from 'react'

interface SecurityState {
  requiresCaptcha: boolean
  isSuspicious: boolean
  isLoading: boolean
  error: string | null
  captchaValidated: boolean
  captchaSessionId: string | null
}

interface SecurityHookReturn extends SecurityState {
  checkSecurityStatus: () => Promise<void>
  setCaptchaValidation: (isValid: boolean, sessionId?: string) => void
  resetSecurity: () => void
}

/**
 * Custom hook to manage security state and CAPTCHA requirements
 */
export function useSecurity(): SecurityHookReturn {
  const [state, setState] = useState<SecurityState>({
    requiresCaptcha: false,
    isSuspicious: false,
    isLoading: true,
    error: null,
    captchaValidated: false,
    captchaSessionId: null
  })

  /**
   * Check security status from server (CAPTCHA disabled)
   */
  const checkSecurityStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // CAPTCHA disabled - always return no CAPTCHA required
      setState(prev => ({
        ...prev,
        requiresCaptcha: false,
        isSuspicious: false,
        isLoading: false,
        error: null
      }))

    } catch (error) {
      console.error('Security status check error:', error)
      // Fail safely - but without CAPTCHA requirement
      setState(prev => ({
        ...prev,
        requiresCaptcha: false,
        isSuspicious: false,
        isLoading: false,
        error: null
      }))
    }
  }

  /**
   * Set CAPTCHA validation result
   */
  const setCaptchaValidation = (isValid: boolean, sessionId?: string) => {
    setState(prev => ({
      ...prev,
      captchaValidated: isValid,
      captchaSessionId: sessionId || null
    }))
  }

  /**
   * Reset security state
   */
  const resetSecurity = () => {
    setState({
      requiresCaptcha: false,
      isSuspicious: false,
      isLoading: true,
      error: null,
      captchaValidated: false,
      captchaSessionId: null
    })
  }

  // Check security status on mount
  useEffect(() => {
    checkSecurityStatus()
  }, [])

  return {
    ...state,
    checkSecurityStatus,
    setCaptchaValidation,
    resetSecurity
  }
}
