
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  AlertCircle,
  MoreHorizontal,
  FileDown,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  CreditCard,
  Building,
  ZoomIn
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

type VerificationStatus = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'

interface KycDocument {
  id: string
  documentType: string
  fileName: string
  fileUrl?: string
  filePath: string
}

interface Submission {
  id: string
  userId: string
  userName: string
  userEmail: string
  userRole: string
  userJoinDate: string
  status: VerificationStatus
  submittedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
  adminNotes: string | null
  documents: KycDocument[]
}

const KycStatusBadge = ({ status }: { status: VerificationStatus }) => {
  const statusConfig = {
    PENDING: {
      className: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="h-3 w-3 mr-1.5" />,
    },
    VERIFIED: {
      className: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="h-3 w-3 mr-1.5" />,
    },
    REJECTED: {
      className: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-3 w-3 mr-1.5" />,
    },
    ALL: {},
  }

  const config = statusConfig[status] || {}

  return (
    <Badge
      variant="outline"
      className={`border-transparent ${config.className}`}
    >
      {config.icon}
      {status}
    </Badge>
  )
}

const DocumentViewer = ({ 
  document, 
  isOpen, 
  onClose 
}: { 
  document: KycDocument | null
  isOpen: boolean
  onClose: () => void
}) => {
  if (!document) return null

  const getDocumentIcon = (docType: string) => {
    switch (docType) {
      case 'ID_FRONT':
      case 'ID_BACK':
        return <CreditCard className="h-4 w-4" />
      case 'BUSINESS_CERT':
        return <Building className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDocumentType = (docType: string) => {
    return docType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDocumentIcon(document.documentType)}
            {formatDocumentType(document.documentType)}
          </DialogTitle>
          <DialogDescription>
            File: {document.fileName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-4">
          <div className="relative max-w-full max-h-[60vh] border rounded-lg overflow-hidden">
            <Image
              src={`/api/admin/kyc/document/${document.id}`}
              alt={formatDocumentType(document.documentType)}
              width={800}
              height={600}
              className="object-contain w-full h-full"
              unoptimized
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => window.open(`/api/admin/kyc/document/${document.id}`, '_blank')}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ViewSubmissionModal = ({
    submission,
    isOpen,
    onClose,
}: {
    submission: Submission | null
    isOpen: boolean
    onClose: () => void
}) => {
    const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null)
    const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

    if (!submission) return null

    const openDocumentViewer = (document: KycDocument) => {
      setSelectedDocument(document)
      setDocumentViewerOpen(true)
    }

    const getDocumentIcon = (docType: string) => {
      switch (docType) {
        case 'ID_FRONT':
        case 'ID_BACK':
          return <CreditCard className="h-4 w-4" />
        case 'BUSINESS_CERT':
          return <Building className="h-4 w-4" />
        default:
          return <FileText className="h-4 w-4" />
      }
    }

    const formatDocumentType = (docType: string) => {
      return docType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <>
          <AlertDialog open={isOpen} onOpenChange={onClose}>
              <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <AlertDialogHeader>
                      <AlertDialogTitle>KYC Submission Details</AlertDialogTitle>
                      <AlertDialogDescription>
                          Reviewing submission for <span className="font-semibold">{submission.userName}</span>
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-6 py-4">
                      {/* User Information */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 bg-gray-50 rounded-lg">
                          <div className="font-semibold">User Name:</div>
                          <div>{submission.userName}</div>
                          <div className="font-semibold">User Email:</div>
                          <div>{submission.userEmail}</div>
                          <div className="font-semibold">User Role:</div>
                          <div><Badge variant="outline">{submission.userRole}</Badge></div>
                          <div className="font-semibold">Joined:</div>
                          <div>{format(new Date(submission.userJoinDate), 'MMM dd, yyyy')}</div>
                          <div className="font-semibold">Status:</div>
                          <div><KycStatusBadge status={submission.status} /></div>
                          <div className="font-semibold">Submitted At:</div>
                          <div>{format(new Date(submission.submittedAt), 'MMM dd, yyyy, p')}</div>
                           {submission.reviewedAt && (
                              <>
                                  <div className="font-semibold">Reviewed At:</div>
                                  <div>{format(new Date(submission.reviewedAt), 'MMM dd, yyyy, p')}</div>
                              </>
                          )}
                      </div>

                      {/* Documents Section */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Submitted Documents</h4>
                        
                        {/* ID Documents Side by Side */}
                        {submission.documents.some(doc => doc.documentType === 'ID_FRONT' || doc.documentType === 'ID_BACK') && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-700">National ID</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {['ID_FRONT', 'ID_BACK'].map(docType => {
                                const document = submission.documents.find(doc => doc.documentType === docType)
                                return (
                                  <div key={docType} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      <span className="font-medium text-sm">
                                        {docType === 'ID_FRONT' ? 'Front Side' : 'Back Side'}
                                      </span>
                                    </div>
                                    {document ? (
                                      <div className="relative border rounded-lg overflow-hidden bg-gray-100 aspect-[3/2]">
                                        <Image
                                          src={`/api/admin/kyc/document/${document.id}`}
                                          alt={`ID ${docType === 'ID_FRONT' ? 'Front' : 'Back'}`}
                                          fill
                                          className="object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => openDocumentViewer(document)}
                                          unoptimized
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-20 transition-opacity">
                                          <ZoomIn className="h-8 w-8 text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="border-2 border-dashed border-gray-300 rounded-lg aspect-[3/2] flex items-center justify-center text-gray-500">
                                        <div className="text-center">
                                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          <span className="text-sm">Not provided</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Business Certificate */}
                        {submission.documents.some(doc => doc.documentType === 'BUSINESS_CERT') && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-700">Business Registration</h5>
                            {submission.documents
                              .filter(doc => doc.documentType === 'BUSINESS_CERT')
                              .map(document => (
                                <div key={document.id} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    <span className="font-medium text-sm">Business Certificate</span>
                                  </div>
                                  <div className="relative border rounded-lg overflow-hidden bg-gray-100 aspect-[3/2] max-w-md">
                                    <Image
                                      src={`/api/admin/kyc/document/${document.id}`}
                                      alt="Business Certificate"
                                      fill
                                      className="object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => openDocumentViewer(document)}
                                      unoptimized
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-20 transition-opacity">
                                      <ZoomIn className="h-8 w-8 text-white" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Admin Notes and Rejection Reason */}
                      {(submission.adminNotes || submission.rejectionReason) && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                          {submission.adminNotes && (
                            <div>
                              <div className="font-semibold text-sm text-gray-700">Admin Notes:</div>
                              <div className="text-sm mt-1">{submission.adminNotes}</div>
                            </div>
                          )}
                          {submission.rejectionReason && (
                            <div>
                              <div className="font-semibold text-sm text-red-700">Rejection Reason:</div>
                              <div className="text-sm mt-1 text-red-600">{submission.rejectionReason}</div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Close</AlertDialogCancel>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          
          <DocumentViewer
            document={selectedDocument}
            isOpen={documentViewerOpen}
            onClose={() => setDocumentViewerOpen(false)}
          />
        </>
    )
}

const ReviewModal = ({
  submission,
  isOpen,
  onClose,
  onConfirm,
}: {
  submission: Submission | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (action: 'approve' | 'reject', reason?: string, adminNotes?: string) => void
}) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

  if (!submission) return null

  const handleConfirm = (action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.')
      return
    }
    onConfirm(action, rejectionReason, adminNotes)
    setRejectionReason('')
    setAdminNotes('')
  }

  const openDocumentViewer = (document: KycDocument) => {
    setSelectedDocument(document)
    setDocumentViewerOpen(true)
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Review KYC Submission</AlertDialogTitle>
            <AlertDialogDescription>
              You are reviewing the submission for{' '}
              <span className="font-semibold">{submission.userName}</span> ({submission.userEmail}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-6 py-4">
            {/* User Profile Comparison */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-sm mb-2">User Profile Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {submission.userName}</p>
                  <p><span className="font-medium">Email:</span> {submission.userEmail}</p>
                  <p><span className="font-medium">Role:</span> {submission.userRole}</p>
                  <p><span className="font-medium">Member since:</span> {format(new Date(submission.userJoinDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Submission Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Submitted:</span> {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}</p>
                  <p><span className="font-medium">Documents:</span> {submission.documents.length} file(s)</p>
                  <p><span className="font-medium">Status:</span> <KycStatusBadge status={submission.status} /></p>
                </div>
              </div>
            </div>

            {/* Documents Review Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Document Review</h4>
              
              {/* ID Documents Side by Side */}
              {submission.documents.some(doc => doc.documentType === 'ID_FRONT' || doc.documentType === 'ID_BACK') && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    National ID Verification
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['ID_FRONT', 'ID_BACK'].map(docType => {
                      const document = submission.documents.find(doc => doc.documentType === docType)
                      return (
                        <div key={docType} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {docType === 'ID_FRONT' ? 'Front Side' : 'Back Side'}
                            </span>
                            {document && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/admin/kyc/document/${document.id}`, '_blank')}
                              >
                                <FileDown className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                          {document ? (
                            <div className="relative border rounded-lg overflow-hidden bg-gray-100 aspect-[3/2]">
                              <Image
                                src={`/api/admin/kyc/document/${document.id}`}
                                alt={`ID ${docType === 'ID_FRONT' ? 'Front' : 'Back'}`}
                                fill
                                className="object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openDocumentViewer(document)}
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-20 transition-opacity">
                                <ZoomIn className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg aspect-[3/2] flex items-center justify-center text-gray-500">
                              <div className="text-center">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <span className="text-sm">Not provided</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Business Certificate */}
              {submission.documents.some(doc => doc.documentType === 'BUSINESS_CERT') && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business Registration
                  </h5>
                  {submission.documents
                    .filter(doc => doc.documentType === 'BUSINESS_CERT')
                    .map(document => (
                      <div key={document.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Business Certificate</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/admin/kyc/document/${document.id}`, '_blank')}
                          >
                            <FileDown className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                        <div className="relative border rounded-lg overflow-hidden bg-gray-100 aspect-[3/2] max-w-md">
                          <Image
                            src={`/api/admin/kyc/document/${document.id}`}
                            alt="Business Certificate"
                            fill
                            className="object-contain cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openDocumentViewer(document)}
                            unoptimized
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-20 transition-opacity">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Review Form */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold">Review Decision</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add any notes about this review..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason (Required if rejecting)</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Provide a clear reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => handleConfirm('reject')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleConfirm('approve')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentViewer
        document={selectedDocument}
        isOpen={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
      />
    </>
  )
}

export default function KycSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<VerificationStatus>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  const fetchSubmissions = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (activeTab !== 'ALL') {
        params.set('status', activeTab)
      }
      const response = await fetch(`/api/admin/kyc/submissions?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch submissions.')
      }
      const result = await response.json()
      
      if (result.success && result.data) {
        setSubmissions(result.data.submissions)
        setTotalPages(result.data.pagination.totalPages)
        setCurrentPage(result.data.pagination.currentPage)
      } else {
        throw new Error(result.error || 'Received an invalid response from the server.')
      }

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred.'
      )
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchSubmissions(1)
  }, [fetchSubmissions])

  const handleReviewAction = async (
    action: 'approve' | 'reject',
    reason?: string,
    adminNotes?: string
  ) => {
    if (!selectedSubmission) return

    try {
      const response = await fetch(
        `/api/admin/kyc/${selectedSubmission.id}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action, 
            rejectionReason: reason,
            adminNotes 
          }),
        }
      )
      const result = await response.json()

      if (response.ok) {
        toast.success(`Submission ${action === 'approve' ? 'approved' : 'rejected'}.`)
        setReviewModalOpen(false)
        setSelectedSubmission(null)
        // Refresh the list
        fetchSubmissions(currentPage)
      } else {
        toast.error(result.error || 'Failed to process review.')
      }
    } catch (error) {
      toast.error('An error occurred while processing the review.')
    }
  }

  const openReviewModal = (submission: Submission) => {
    setSelectedSubmission(submission)
    setReviewModalOpen(true)
  }

  const closeReviewModal = () => {
    setSelectedSubmission(null)
    setReviewModalOpen(false)
  }

  const openViewModal = (submission: Submission) => {
    setSelectedSubmission(submission)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setSelectedSubmission(null)
    setViewModalOpen(false)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    if (error) {
      return (
        <div className="p-8 text-center text-red-600">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>{error}</p>
        </div>
      )
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  <div className="font-medium">{submission.userName}</div>
                  <div className="text-xs text-muted-foreground">
                    {submission.userEmail}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{submission.userRole}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {submission.documents.map((doc) => (
                      <Badge key={doc.id} variant="secondary" className="text-xs">
                        {doc.documentType.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(submission.submittedAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <KycStatusBadge status={submission.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <DropdownMenuItem onClick={() => openViewModal(submission)}>
                           <Eye className="mr-2 h-4 w-4" />
                           View Details
                       </DropdownMenuItem>
                      {submission.status === 'PENDING' && (
                        <DropdownMenuItem
                          onClick={() => openReviewModal(submission)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Review Submission
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No submissions found for this status.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Submissions</h1>
            <p className="text-muted-foreground">Review and manage user identity verification documents with enhanced document viewing.</p>
        </div>
        <Card>
          <CardHeader>
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as VerificationStatus)
              }
            >
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="VERIFIED">Verified</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
        {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => fetchSubmissions(currentPage - 1)} disabled={currentPage <= 1}>Previous</Button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => fetchSubmissions(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
            </div>
        )}
      </div>
      <ReviewModal
        submission={selectedSubmission}
        isOpen={reviewModalOpen}
        onClose={closeReviewModal}
        onConfirm={handleReviewAction}
      />
      <ViewSubmissionModal 
        submission={selectedSubmission}
        isOpen={viewModalOpen}
        onClose={closeViewModal}
      />
    </>
  )
}
