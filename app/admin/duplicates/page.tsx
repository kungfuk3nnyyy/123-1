
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Loader2, AlertTriangle, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface DuplicateStats {
  totalDetections: number
  unresolvedDetections: number
  registrationAttempts: number
  recentDetections: number
}

interface PotentialDuplicate {
  userId: string
  email: string
  name: string | null
  role: string
  createdAt: string
  similarityScore: number
  reasons: string[]
}

interface MergePreview {
  primaryUser: {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
  }
  mergedUser: {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
  }
  dataToMerge: {
    bookings: number
    messages: number
    reviews: number
    transactions: number
    events: number
    packages: number
    notifications: number
  }
  conflicts: string[]
}

export default function DuplicatesPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DuplicateStats | null>(null)
  const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [mergeDialog, setMergeDialog] = useState<{
    open: boolean
    duplicate?: PotentialDuplicate
    preview?: MergePreview
  }>({ open: false })
  const [mergeReason, setMergeReason] = useState('')
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadStats()
      loadDuplicates()
    }
  }, [session])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/duplicates?action=stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadDuplicates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/duplicates?action=pending')
      if (response.ok) {
        const data = await response.json()
        setDuplicates(data.pendingMerges || [])
      }
    } catch (error) {
      console.error('Error loading duplicates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load duplicate users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const scanForDuplicates = async () => {
    try {
      setScanning(true)
      const response = await fetch('/api/admin/duplicates?action=scan')
      if (response.ok) {
        const data = await response.json()
        setDuplicates(data.duplicates || [])
        toast({
          title: 'Scan Complete',
          description: `Found ${data.duplicates?.length || 0} potential duplicates`
        })
      }
    } catch (error) {
      console.error('Error scanning for duplicates:', error)
      toast({
        title: 'Error',
        description: 'Failed to scan for duplicates',
        variant: 'destructive'
      })
    } finally {
      setScanning(false)
    }
  }

  const previewMerge = async (duplicate: PotentialDuplicate) => {
    try {
      // Find the original user (we need to implement this logic)
      const response = await fetch('/api/admin/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryUserId: 'original-user-id', // This needs to be determined
          mergedUserId: duplicate.userId,
          preview: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMergeDialog({
          open: true,
          duplicate,
          preview: data.preview
        })
      }
    } catch (error) {
      console.error('Error previewing merge:', error)
      toast({
        title: 'Error',
        description: 'Failed to preview merge',
        variant: 'destructive'
      })
    }
  }

  const performMerge = async () => {
    if (!mergeDialog.duplicate || !mergeDialog.preview) return

    try {
      setMerging(true)
      const response = await fetch('/api/admin/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryUserId: mergeDialog.preview.primaryUser.id,
          mergedUserId: mergeDialog.preview.mergedUser.id,
          reason: mergeReason || 'Admin-initiated merge'
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Accounts merged successfully'
        })
        setMergeDialog({ open: false })
        setMergeReason('')
        loadDuplicates()
        loadStats()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Merge failed')
      }
    } catch (error) {
      console.error('Error merging accounts:', error)
      toast({
        title: 'Error',
        description: 'Failed to merge accounts',
        variant: 'destructive'
      })
    } finally {
      setMerging(false)
    }
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 0.95) return 'bg-red-100 text-red-800'
    if (score >= 0.85) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.95) return 'High'
    if (score >= 0.85) return 'Medium'
    return 'Low'
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Duplicate User Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage duplicate user accounts in the system
          </p>
        </div>
        <Button onClick={scanForDuplicates} disabled={scanning}>
          {scanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Scan for Duplicates
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDetections}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unresolvedDetections}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Registrations</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.registrationAttempts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent (7 days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentDetections}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Duplicates List */}
      <Card>
        <CardHeader>
          <CardTitle>Potential Duplicate Users</CardTitle>
          <CardDescription>
            Users that may be duplicates based on email, name, or phone number similarity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No potential duplicates found
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((duplicate, index) => (
                <div key={duplicate.userId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{duplicate.email}</span>
                        <Badge variant="outline">{duplicate.role}</Badge>
                        <Badge className={getSimilarityColor(duplicate.similarityScore)}>
                          {getSimilarityLabel(duplicate.similarityScore)} ({(duplicate.similarityScore * 100).toFixed(1)}%)
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {duplicate.name && <span>Name: {duplicate.name} • </span>}
                        Created: {new Date(duplicate.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Reasons: </span>
                        {duplicate.reasons.join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewMerge(duplicate)}
                      >
                        Preview Merge
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Dialog */}
      <Dialog open={mergeDialog.open} onOpenChange={(open) => setMergeDialog({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Account Preview</DialogTitle>
            <DialogDescription>
              Review the merge details before proceeding. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {mergeDialog.preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Primary Account (Keep)</Label>
                  <div className="p-3 border rounded-lg bg-green-50">
                    <div className="font-medium">{mergeDialog.preview.primaryUser.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {mergeDialog.preview.primaryUser.name} • {mergeDialog.preview.primaryUser.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(mergeDialog.preview.primaryUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account to Merge (Delete)</Label>
                  <div className="p-3 border rounded-lg bg-red-50">
                    <div className="font-medium">{mergeDialog.preview.mergedUser.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {mergeDialog.preview.mergedUser.name} • {mergeDialog.preview.mergedUser.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(mergeDialog.preview.mergedUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data to be Merged</Label>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>Bookings: {mergeDialog.preview.dataToMerge.bookings}</div>
                  <div>Messages: {mergeDialog.preview.dataToMerge.messages}</div>
                  <div>Reviews: {mergeDialog.preview.dataToMerge.reviews}</div>
                  <div>Transactions: {mergeDialog.preview.dataToMerge.transactions}</div>
                  <div>Events: {mergeDialog.preview.dataToMerge.events}</div>
                  <div>Packages: {mergeDialog.preview.dataToMerge.packages}</div>
                </div>
              </div>

              {mergeDialog.preview.conflicts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-600">Conflicts</Label>
                  <div className="space-y-1">
                    {mergeDialog.preview.conflicts.map((conflict, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {conflict}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="merge-reason">Merge Reason</Label>
                <Textarea
                  id="merge-reason"
                  placeholder="Enter reason for merging these accounts..."
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={performMerge} disabled={merging}>
              {merging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Merge Accounts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
