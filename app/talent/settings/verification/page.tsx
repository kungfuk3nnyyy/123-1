
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  FileText,
  CreditCard,
  Building,
  User,
  ArrowLeft,
  Eye,
  X
} from 'lucide-react'
import Link from 'next/link'
import { VerificationStatus } from '@prisma/client'
import Image from 'next/image'
import { useZodForm } from '@/hooks/useZodForm'
import { kycSchema, type KYCFormData } from '@/lib/validation/schemas'
import { FormField } from '@/components/ui/form-field'
import { FormSubmitButton } from '@/components/ui/form-submit-button'

interface KycDocument {
  id: string
  documentType: string
  fileName: string
  fileUrl?: string
}

interface KycStatus {
  verificationStatus: VerificationStatus
  latestSubmission: {
    id: string
    status: VerificationStatus
    submittedAt: string
    reviewedAt: string | null
    rejectionReason: string | null
    adminNotes: string | null
    documents: KycDocument[]
  } | null
}

export default function VerificationPage() {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting }
  } = useZodForm(kycSchema, {
    defaultValues: {
      documentType: 'national_id' as 'national_id' | 'business_registration'
    }
  })

  const watchedDocumentType = watch('documentType')

  // File state
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [businessCertFile, setBusinessCertFile] = useState<File | null>(null)
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null)
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null)
  const [businessCertPreview, setBusinessCertPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchKycStatus()
  }, [])

  const fetchKycStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/me/kyc-submit')
      
      if (response.ok) {
        const data = await response.json()
        setKycStatus(data.data)
      } else {
        throw new Error('Failed to fetch KYC status')
      }
    } catch (err) {
      setError('Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  const validateFileUpload = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    
    if (file.size > maxSize) {
      return `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Please use JPEG, PNG, or PDF files.`
    }
    
    if (file.size === 0) {
      return 'File appears to be empty. Please select a valid file.'
    }
    
    return null
  }

  const handleFileChange = (
    file: File | null, 
    setFile: (file: File | null) => void, 
    setPreview: (preview: string | null) => void
  ) => {
    setError(null) // Clear any previous errors
    
    if (!file) {
      setFile(null)
      setPreview(null)
      return
    }
    
    // Validate file
    const validationError = validateFileUpload(file)
    if (validationError) {
      setError(validationError)
      setFile(null)
      setPreview(null)
      return
    }
    
    setFile(file)
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.onerror = () => {
        setError('Failed to read file for preview')
        setPreview(null)
      }
      reader.readAsDataURL(file)
    } else {
      // For PDFs, show a placeholder
      setPreview('pdf-placeholder')
    }
  }

  const clearFile = (
    setFile: (file: File | null) => void, 
    setPreview: (preview: string | null) => void,
    inputId: string
  ) => {
    setFile(null)
    setPreview(null)
    const input = document.getElementById(inputId) as HTMLInputElement
    if (input) input.value = ''
  }

  const onSubmit = async (data: KYCFormData) => {
    // Validation based on document type
    if (data.documentType === 'national_id') {
      if (!idFrontFile || !idBackFile) {
        setError('Please upload both front and back of your National ID')
        return
      }
    } else if (data.documentType === 'business_registration') {
      if (!businessCertFile) {
        setError('Please upload your Business Registration Certificate')
        return
      }
    }

    setSubmitting(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(null)

    try {
      setUploadProgress(10) // Starting upload
      const formData = new FormData()
      formData.append('documentType', data.documentType)
      
      if (data.documentType === 'national_id') {
        if (idFrontFile) formData.append('idFront', idFrontFile)
        if (idBackFile) formData.append('idBack', idBackFile)
      } else if (data.documentType === 'business_registration') {
        if (businessCertFile) formData.append('businessCert', businessCertFile)
      }

      setUploadProgress(30) // Prepared data

      const response = await fetch('/api/me/kyc-submit', {
        method: 'POST',
        body: formData
      })

      setUploadProgress(80) // Upload complete, processing

      const result = await response.json()

      if (response.ok) {
        setUploadProgress(100) // Complete
        setSuccess(result.message || 'KYC documents submitted successfully! Your submission is under review.')
        setValue('documentType', 'national_id')
        setIdFrontFile(null)
        setIdBackFile(null)
        setBusinessCertFile(null)
        setIdFrontPreview(null)
        setIdBackPreview(null)
        setBusinessCertPreview(null)
        
        // Reset file inputs
        const inputs = ['idFrontFile', 'idBackFile', 'businessCertFile']
        inputs.forEach(id => {
          const input = document.getElementById(id) as HTMLInputElement
          if (input) input.value = ''
        })
        
        // Refresh status
        await fetchKycStatus()
      } else {
        setUploadProgress(0) // Reset on error
        // Handle detailed error messages
        if (result.details && Array.isArray(result.details)) {
          setError(`Upload failed: ${result.details.join(', ')}`)
        } else {
          setError(result.error || 'Failed to submit KYC documents')
        }
      }
    } catch (err) {
      setUploadProgress(0) // Reset on error
      setError('Failed to submit KYC documents. Please check your internet connection and try again.')
    } finally {
      setSubmitting(false)
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'UNVERIFIED':
        return (
          <Badge variant="secondary" className="gap-2">
            <User className="w-3 h-3" />
            Not Verified
          </Badge>
        )
      case VerificationStatus.PENDING:
        return (
          <Badge variant="outline" className="gap-2 border-yellow-500 text-yellow-700">
            <Clock className="w-3 h-3" />
            Under Review
          </Badge>
        )
      case VerificationStatus.VERIFIED:
        return (
          <Badge variant="default" className="gap-2 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3" />
            Verified
          </Badge>
        )
      case VerificationStatus.REJECTED:
        return (
          <Badge variant="destructive" className="gap-2">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const FilePreview = ({ 
    preview, 
    fileName, 
    onClear, 
    label 
  }: { 
    preview: string | null
    fileName: string | null
    onClear: () => void
    label: string
  }) => {
    if (!preview) return null

    const isPdf = preview === 'pdf-placeholder'

    return (
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative w-full h-32 bg-white rounded border flex items-center justify-center">
          {isPdf ? (
            <div className="text-center">
              <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <span className="text-sm text-gray-600">PDF Document</span>
            </div>
          ) : (
            <Image
              src={preview}
              alt={label}
              fill
              className="object-contain rounded"
            />
          )}
        </div>
        {fileName && (
          <p className="text-xs text-gray-500 mt-2 truncate" title={fileName}>
            {fileName}
          </p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/talent/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/talent/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-blue-100">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-calm-dark-grey">Identity Verification</h1>
          <p className="text-calm-dark-grey/80">Verify your identity to enable payouts and build trust</p>
        </div>
      </div>

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verification Status
              </CardTitle>
              <CardDescription>Your current verification status and history</CardDescription>
            </div>
            {kycStatus && getStatusBadge(kycStatus.verificationStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {kycStatus?.verificationStatus === VerificationStatus.UNVERIFIED && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Verification Required:</strong> You must verify your identity to receive payouts and access all platform features.
              </AlertDescription>
            </Alert>
          )}

          {kycStatus?.verificationStatus === VerificationStatus.PENDING && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Under Review:</strong> Your documents are being reviewed by our team. This typically takes 1-2 business days.
              </AlertDescription>
            </Alert>
          )}

          {kycStatus?.verificationStatus === VerificationStatus.VERIFIED && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Verified:</strong> Your identity has been successfully verified. You can now receive payouts and have full access to all features.
              </AlertDescription>
            </Alert>
          )}

          {kycStatus?.verificationStatus === VerificationStatus.REJECTED && kycStatus.latestSubmission && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Verification Rejected:</strong> {kycStatus.latestSubmission.rejectionReason || 'Please contact support for more details.'}
                {kycStatus.latestSubmission.adminNotes && (
                  <div className="mt-2">
                    <strong>Admin Notes:</strong> {kycStatus.latestSubmission.adminNotes}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Latest Submission Details */}
          {kycStatus?.latestSubmission && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">Latest Submission</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Documents:</span>
                  <p className="font-medium">
                    {kycStatus.latestSubmission.documents.length} document(s) submitted
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <p className="font-medium">{formatDate(kycStatus.latestSubmission.submittedAt)}</p>
                </div>
                {kycStatus.latestSubmission.reviewedAt && (
                  <div>
                    <span className="text-gray-500">Reviewed:</span>
                    <p className="font-medium">{formatDate(kycStatus.latestSubmission.reviewedAt)}</p>
                  </div>
                )}
              </div>
              
              {/* Document List */}
              {kycStatus.latestSubmission.documents.length > 0 && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">Submitted Documents:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {kycStatus.latestSubmission.documents.map((doc) => (
                      <Badge key={doc.id} variant="outline" className="text-xs">
                        {doc.documentType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Form - Only show if not verified or pending */}
      {(!kycStatus || (kycStatus.verificationStatus !== VerificationStatus.VERIFIED && kycStatus.verificationStatus !== VerificationStatus.PENDING)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Submit Verification Documents
            </CardTitle>
            <CardDescription>
              Upload your identification documents for verification. Accepted formats: JPEG, PNG, PDF (max 10MB each)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  label="Document Type"
                  error={errors.documentType}
                  required
                >
                  <Select 
                    value={watchedDocumentType} 
                    onValueChange={(value) => setValue('documentType', value as 'national_id' | 'business_registration')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          National ID Card
                        </div>
                      </SelectItem>
                      <SelectItem value="business_registration">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Business Registration Certificate
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {watchedDocumentType === 'national_id' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="ID Front Side"
                      required
                      description="Upload a clear photo of the front side of your National ID"
                    >
                      <div className="space-y-3">
                        <Input
                          id="idFrontFile"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange(
                            e.target.files?.[0] || null, 
                            setIdFrontFile, 
                            setIdFrontPreview
                          )}
                          className="cursor-pointer"
                        />
                        <FilePreview
                          preview={idFrontPreview}
                          fileName={idFrontFile?.name || null}
                          onClear={() => clearFile(setIdFrontFile, setIdFrontPreview, 'idFrontFile')}
                          label="ID Front"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="ID Back Side"
                      required
                      description="Upload a clear photo of the back side of your National ID"
                    >
                      <div className="space-y-3">
                        <Input
                          id="idBackFile"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileChange(
                            e.target.files?.[0] || null, 
                            setIdBackFile, 
                            setIdBackPreview
                          )}
                          className="cursor-pointer"
                        />
                        <FilePreview
                          preview={idBackPreview}
                          fileName={idBackFile?.name || null}
                          onClear={() => clearFile(setIdBackFile, setIdBackPreview, 'idBackFile')}
                          label="ID Back"
                        />
                      </div>
                    </FormField>
                  </div>
                )}

                {watchedDocumentType === 'business_registration' && (
                  <FormField
                    label="Business Registration Certificate"
                    required
                    description="Upload your official Business Registration Certificate"
                  >
                    <div className="space-y-3">
                      <Input
                        id="businessCertFile"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(
                          e.target.files?.[0] || null, 
                          setBusinessCertFile, 
                          setBusinessCertPreview
                        )}
                        className="cursor-pointer"
                      />
                      <FilePreview
                        preview={businessCertPreview}
                        fileName={businessCertFile?.name || null}
                        onClear={() => clearFile(setBusinessCertFile, setBusinessCertPreview, 'businessCertFile')}
                        label="Business Certificate"
                      />
                    </div>
                  </FormField>
                )}

                <p className="text-xs text-gray-500">
                  Maximum file size: 10MB per file. Accepted formats: JPEG, PNG, PDF
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {submitting && uploadProgress > 0 && (
                  <div className="w-full">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading documents...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <FormSubmitButton
                  isSubmitting={isSubmitting || submitting}
                  isValid={!!(isValid && (
                    (watchedDocumentType === 'national_id' && idFrontFile && idBackFile) ||
                    (watchedDocumentType === 'business_registration' && businessCertFile)
                  ))}
                  className="w-full"
                >
                  {isSubmitting || submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Preparing...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </FormSubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Verification Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">For Individual Talents:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Upload clear photos of your National ID (front and back sides)</li>
                <li>• Ensure all text is legible and visible</li>
                <li>• ID must be valid and not expired</li>
                <li>• Both sides are required for complete verification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">For Business/Company Accounts:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Upload Business Registration Certificate</li>
                <li>• Document must be issued by relevant Kenyan authorities</li>
                <li>• Certificate must be current and valid</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Privacy & Security:</strong> Your documents are stored securely and only accessible by authorized verification staff. We comply with all data protection regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
