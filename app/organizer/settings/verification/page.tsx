
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

export default function OrganizerVerificationPage() {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [documentType, setDocumentType] = useState('national_id')
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

  const handleFileChange = (
    file: File | null, 
    setFile: (file: File | null) => void, 
    setPreview: (preview: string | null) => void
  ) => {
    setFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation based on document type
    if (documentType === 'national_id') {
      if (!idFrontFile || !idBackFile) {
        setError('Please upload both front and back of your National ID')
        return
      }
    } else if (documentType === 'business_registration') {
      if (!businessCertFile) {
        setError('Please upload your Business Registration Certificate')
        return
      }
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('documentType', documentType)
      
      if (documentType === 'national_id') {
        if (idFrontFile) formData.append('idFront', idFrontFile)
        if (idBackFile) formData.append('idBack', idBackFile)
      } else if (documentType === 'business_registration') {
        if (businessCertFile) formData.append('businessCert', businessCertFile)
      }

      const response = await fetch('/api/me/kyc-submit', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('KYC documents submitted successfully! Your submission is under review.')
        setDocumentType('national_id')
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
        setError(data.error || 'Failed to submit KYC documents')
      }
    } catch (err) {
      setError('Failed to submit KYC documents. Please try again.')
    } finally {
      setSubmitting(false)
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
        <div className="relative w-full h-32 bg-white rounded border">
          <Image
            src={preview}
            alt={label}
            fill
            className="object-contain rounded"
          />
        </div>
        {fileName && (
          <p className="text-xs text-gray-500 mt-2 truncate">{fileName}</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/organizer/settings">
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
        <Link href="/organizer/settings">
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
          <p className="text-calm-dark-grey/80">Verify your identity to build trust with talents</p>
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
                <strong>Verification Recommended:</strong> Verify your identity to build trust with talents and showcase your credibility as an event organizer.
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
                <strong>Verified:</strong> Your identity has been successfully verified. Your verified badge helps build trust with talents.
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
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
                </div>

                {documentType === 'national_id' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="idFrontFile">ID Front Side *</Label>
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

                    <div className="space-y-3">
                      <Label htmlFor="idBackFile">ID Back Side *</Label>
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
                  </div>
                )}

                {documentType === 'business_registration' && (
                  <div className="space-y-3">
                    <Label htmlFor="businessCertFile">Business Registration Certificate *</Label>
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

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit for Verification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Verification Benefits & Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Benefits of Verification:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Verified badge displayed on your profile</li>
                <li>• Increased trust from talents and vendors</li>
                <li>• Priority support from our team</li>
                <li>• Enhanced credibility for your events</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Document Requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>Individual Organizers:</strong> Upload clear photos of your National ID (front and back sides)</li>
                <li>• <strong>Companies:</strong> Upload Business Registration Certificate</li>
                <li>• All documents must be valid, current, and clearly legible</li>
                <li>• Both sides of National ID are required for complete verification</li>
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
