
'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Mail, Lock, ArrowRight, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { GigSecureLogo } from '@/components/gigsecure-logo'
import { useZodForm } from '@/hooks/useZodForm'
import { loginSchema, type LoginFormData } from '@/lib/validation/schemas'
import { FormField } from '@/components/ui/form-field'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { UserRole } from '@prisma/client'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting }
  } = useZodForm(loginSchema, {
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const watchedEmail = watch('email')

  // Role-based redirect function
  const getRedirectUrl = (userRole: string) => {
    switch (userRole) {
      case UserRole.ADMIN:
        return '/admin'
      case UserRole.TALENT:
        return '/talent/dashboard'
      case UserRole.ORGANIZER:
        return '/organizer/dashboard'
      default:
        return '/'
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    setIsEmailNotVerified(false)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        if (result.error.includes('Email not verified')) {
          setIsEmailNotVerified(true)
          setError('Your email address is not verified. Please check your email and click the verification link, or request a new verification email below.')
          toast.error('Email verification required')
        } else {
          setError('Invalid email or password')
          toast.error('Login failed')
        }
      } else {
        // Get the session to determine user role for redirect
        const session = await getSession()
        if (session?.user) {
          const redirectUrl = getRedirectUrl(session.user.role)
          toast.success('Welcome back!')
          router.push(redirectUrl)
          router.refresh()
        } else {
          // Fallback redirect if session is not immediately available
          toast.success('Welcome back!')
          router.push('/')
          router.refresh()
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!watchedEmail) {
      toast.error('Please enter your email address first')
      return
    }

    setIsResendingVerification(true)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: watchedEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Verification email sent! Please check your email.')
        router.push(`/auth/verify-email-pending?email=${encodeURIComponent(watchedEmail)}`)
      } else {
        toast.error(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-light-grey via-white to-calm-soft-blue/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <GigSecureLogo size="xl" variant="default" className="mx-auto mb-4" />
          <p className="text-calm-dark-grey/70 text-lg">Welcome back to Kenya's premier talent platform</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold text-center text-calm-dark-grey">Sign In</CardTitle>
            <CardDescription className="text-center text-calm-dark-grey/60">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert className={`${isEmailNotVerified ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
                  {isEmailNotVerified && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                  <AlertDescription className={`${isEmailNotVerified ? 'text-orange-800' : 'text-red-800'}`}>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {isEmailNotVerified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    Need a new verification email?
                  </p>
                  <Button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification || !watchedEmail}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {isResendingVerification ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending Verification Email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              )}

              <FormField
                label="Email Address"
                error={errors.email}
                required
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue"
                  />
                </div>
              </FormField>

              <FormField
                label="Password"
                error={errors.password}
                required
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 hover:text-calm-dark-grey"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <div className="flex items-center justify-between">
                <FormField error={errors.rememberMe}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      {...register('rememberMe')}
                      id="rememberMe"
                    />
                    <Label htmlFor="rememberMe" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                </FormField>

                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-calm-soft-blue hover:text-calm-dark-grey transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <FormSubmitButton
                isSubmitting={isSubmitting || isLoading}
                isValid={isValid}
                className="w-full bg-gradient-to-r from-calm-soft-blue to-calm-dark-grey hover:from-calm-soft-blue/90 hover:to-calm-dark-grey/90 text-white font-medium py-2.5"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </FormSubmitButton>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-calm-dark-grey/60">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-calm-soft-blue hover:text-calm-dark-grey transition-colors"
                >
                  Create one here
                </Link>
              </p>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
