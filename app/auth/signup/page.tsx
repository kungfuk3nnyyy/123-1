
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, User, Mail, Lock, UserCheck, ArrowRight, Gift, Check, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { UserRole } from '@prisma/client'
import { GigSecureLogo } from '@/components/gigsecure-logo'
import { useZodForm } from '@/hooks/useZodForm'
import { registrationSchema, type RegistrationFormData } from '@/lib/validation/schemas'
import { FormField } from '@/components/ui/form-field'
import { FormSubmitButton } from '@/components/ui/form-submit-button'

// Password strength checker component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const [strength, setStrength] = useState({
    score: 0,
    feedback: [] as string[],
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  })

  useEffect(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    }

    const score = Object.values(checks).filter(Boolean).length
    const feedback = []

    if (!checks.length) feedback.push('At least 8 characters')
    if (!checks.uppercase) feedback.push('One uppercase letter')
    if (!checks.lowercase) feedback.push('One lowercase letter')
    if (!checks.number) feedback.push('One number')
    if (!checks.special) feedback.push('One special character (@$!%*?&)')

    setStrength({ score, feedback, checks })
  }, [password])

  if (!password) return null

  const getStrengthColor = () => {
    if (strength.score <= 2) return 'text-red-600 bg-red-100'
    if (strength.score <= 3) return 'text-orange-600 bg-orange-100'
    if (strength.score <= 4) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getStrengthText = () => {
    if (strength.score <= 2) return 'Weak'
    if (strength.score <= 3) return 'Fair'
    if (strength.score <= 4) return 'Good'
    return 'Strong'
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              strength.score <= 2 ? 'bg-red-500' :
              strength.score <= 3 ? 'bg-orange-500' :
              strength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs px-2 py-1 rounded ${getStrengthColor()}`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-1 text-xs">
        {Object.entries(strength.checks).map(([key, passed]) => (
          <div key={key} className={`flex items-center gap-1 ${passed ? 'text-green-600' : 'text-gray-500'}`}>
            {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>
              {key === 'length' && 'At least 8 characters'}
              {key === 'uppercase' && 'One uppercase letter (A-Z)'}
              {key === 'lowercase' && 'One lowercase letter (a-z)'}
              {key === 'number' && 'One number (0-9)'}
              {key === 'special' && 'One special character (@$!%*?&)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignupPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [referralValidated, setReferralValidated] = useState<boolean | null>(null)
  const [referralInfo, setReferralInfo] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting }
  } = useZodForm(registrationSchema, {
    mode: 'onBlur', // Changed from onChange to onBlur for better UX
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      userType: undefined,
      terms: false
    }
  })

  const watchedReferralCode = watch('referralCode')
  const watchedPassword = watch('password')

  // Handle URL parameters for referral codes
  useEffect(() => {
    const refParam = searchParams.get('ref')
    if (refParam) {
      setValue('referralCode', refParam)
      validateReferralCode(refParam)
    }
  }, [searchParams, setValue])

  // Watch for referral code changes
  useEffect(() => {
    if (watchedReferralCode) {
      validateReferralCode(watchedReferralCode)
    } else {
      setReferralValidated(null)
      setReferralInfo(null)
    }
  }, [watchedReferralCode])

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidated(null)
      setReferralInfo(null)
      return
    }

    try {
      const response = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code })
      })
      
      const data = await response.json()
      setReferralValidated(data.valid)
      setReferralInfo(data.valid ? data : null)
      
      if (data.valid) {
        toast.success(`Valid referral code! You'll get KES ${data.reward} credit when you join.`)
      }
    } catch (error) {
      console.error('Error validating referral code:', error)
      setReferralValidated(false)
      setReferralInfo(null)
    }
  }

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)

    try {
      const signupData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phoneNumber: data.phone,
        password: data.password,
        role: data.userType === 'talent' ? UserRole.TALENT : UserRole.ORGANIZER,
        referralCode: data.referralCode || ''
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Signup failed')
      } else {
        // Handle referral success message
        let successMessage = 'Account created!'
        if (result.referralProcessed && result.referralReward > 0) {
          successMessage += ` You've received KES ${result.referralReward} credit!`
        }
        
        if (result.requiresEmailVerification) {
          successMessage += ' Please check your email to verify your account.'
          toast.success(successMessage)
          router.push(`/auth/verify-email-pending?email=${encodeURIComponent(data.email)}`)
        } else {
          toast.success(successMessage)
          router.push('/auth/login')
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-light-grey via-white to-calm-soft-blue/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <GigSecureLogo size="xl" variant="default" className="mx-auto mb-4" />
          <p className="text-calm-dark-grey/70 text-lg">Join Kenya's premier talent booking platform</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold text-center text-calm-dark-grey">Create Account</CardTitle>
            <CardDescription className="text-center text-calm-dark-grey/60">
              Get started by creating your GigSecure account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="First Name"
                    error={errors.firstName}
                    required
                  >
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                      <Input
                        {...register('firstName')}
                        placeholder="Enter your first name"
                        className="pl-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Last Name"
                    error={errors.lastName}
                    required
                  >
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                      <Input
                        {...register('lastName')}
                        placeholder="Enter your last name"
                        className="pl-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue"
                      />
                    </div>
                  </FormField>
                </div>

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
                  label="Phone Number"
                  error={errors.phone}
                  required
                  description="Enter your Kenyan phone number (e.g., +254712345678 or 0712345678)"
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                    <Input
                      {...register('phone')}
                      type="tel"
                      placeholder="+254712345678"
                      className="pl-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Account Type"
                  error={errors.userType}
                  required
                >
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4 z-10" />
                    <Select onValueChange={(value) => setValue('userType', value as 'talent' | 'organizer')}>
                      <SelectTrigger className="pl-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue">
                        <SelectValue placeholder="Select your account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organizer">Event Organizer - I need talents for events</SelectItem>
                        <SelectItem value="talent">Talent - I offer services for events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormField>

                {/* Referral Code Field */}
                <FormField
                  label="Referral Code (Optional)"
                  error={errors.referralCode}
                >
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                    <Input
                      {...register('referralCode')}
                      placeholder="Enter referral code"
                      className={`pl-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue ${
                        referralValidated === true ? 'border-green-500 bg-green-50' :
                        referralValidated === false ? 'border-red-500 bg-red-50' : ''
                      }`}
                    />
                    {referralValidated === true && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {referralInfo && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded mt-2">
                      🎉 Valid referral from <strong>{referralInfo.referrer.name}</strong>! You'll get KES {referralInfo.reward} credit.
                    </div>
                  )}
                  {referralValidated === false && watchedReferralCode && (
                    <div className="text-sm text-red-600 mt-2">
                      Invalid referral code. Please check and try again.
                    </div>
                  )}
                </FormField>

                <FormField
                  label="Password"
                  error={errors.password}
                  required
                  description="Create a strong password with the requirements below"
                >
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
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
                  <PasswordStrengthIndicator password={watchedPassword || ''} />
                </FormField>

                <FormField
                  label="Confirm Password"
                  error={errors.confirmPassword}
                  required
                >
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 h-4 w-4" />
                    <Input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 focus:ring-calm-soft-blue focus:border-calm-soft-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-calm-dark-grey/50 hover:text-calm-dark-grey"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormField>

                <FormField
                  error={errors.terms}
                  required
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      {...register('terms')}
                      id="terms"
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{' '}
                      <Link href="/terms" className="text-calm-soft-blue hover:underline">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-calm-soft-blue hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </FormField>

                {/* Form validation status indicator */}
                {!isValid && Object.keys(errors).length > 0 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      <div className="font-medium mb-2">Please complete the following:</div>
                      <ul className="text-sm space-y-1">
                        {errors.firstName && <li>• Enter your first name</li>}
                        {errors.lastName && <li>• Enter your last name</li>}
                        {errors.email && <li>• Enter a valid email address</li>}
                        {errors.phone && <li>• Enter a valid Kenyan phone number</li>}
                        {errors.userType && <li>• Select your account type</li>}
                        {errors.password && <li>• Create a strong password</li>}
                        {errors.confirmPassword && <li>• Confirm your password</li>}
                        {errors.terms && <li>• Accept the terms and conditions</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <FormSubmitButton
                    isSubmitting={isSubmitting || isLoading}
                    isValid={isValid}
                    allowInvalidSubmit={true}
                    className={`w-full font-medium py-2.5 transition-all duration-200 ${
                      isValid 
                        ? 'bg-gradient-to-r from-calm-soft-blue to-calm-dark-grey hover:from-calm-soft-blue/90 hover:to-calm-dark-grey/90 text-white' 
                        : 'bg-gradient-to-r from-calm-soft-blue/70 to-calm-dark-grey/70 hover:from-calm-soft-blue/80 hover:to-calm-dark-grey/80 text-white'
                    }`}
                  >
                    {isSubmitting || isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </FormSubmitButton>
                  
                  {!isValid && (
                    <p className="text-xs text-center text-calm-dark-grey/60">
                      You can create your account now. Any missing information will be highlighted above.
                    </p>
                  )}
                </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-calm-dark-grey/60">
                Already have an account?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-calm-soft-blue hover:text-calm-dark-grey transition-colors"
                >
                  Sign in here
                </Link>
              </p>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  )
}
