'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Crown,
  Camera,
  Building,
  RefreshCw,
  Download,
  Eye,
  UserCog,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  AlertTriangle,
  Shield,
  MoreVertical,
  User as UserIcon
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  joinDate: string
  totalBookings: number
  category: string
  verified: boolean
  adminApprovalStatus?: string
  adminApprovedAt?: string
  adminRejectedAt?: string
  adminRejectionReason?: string
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  talentsCount: number
  organizersCount: number
  pendingAdmins: number
  approvedAdmins: number
  rejectedAdmins: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}


// New component to view user details in a dialog
const ViewUserDialog = ({ user, isOpen, onClose }: { user: User | null, isOpen: boolean, onClose: () => void }) => {
    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-6 w-6" />
                        User Details
                    </DialogTitle>
                    <DialogDescription>
                        Viewing complete profile for {user.name || user.email}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">User ID</span>
                        <span className="col-span-2 font-mono text-xs">{user.id}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Name</span>
                        <span className="col-span-2">{user.name}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Email</span>
                        <span className="col-span-2">{user.email}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Role</span>
                        <span className="col-span-2">{user.role}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Account Status</span>
                        <span className="col-span-2">{user.status}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Joined On</span>
                        <span className="col-span-2">{user.joinDate}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Total Bookings</span>
                        <span className="col-span-2">{user.totalBookings}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Category</span>
                        <span className="col-span-2">{user.category || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-right">Email Verified</span>
                        <span className="col-span-2">{user.verified ? 'Yes' : 'No'}</span>
                    </div>
                    {user.role === 'ADMIN' && (
                        <>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-semibold text-right">Admin Approval</span>
                                <span className="col-span-2">{user.adminApprovalStatus}</span>
                            </div>
                            {user.adminApprovedAt && (
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-semibold text-right">Approved At</span>
                                    <span className="col-span-2">{new Date(user.adminApprovedAt).toLocaleString()}</span>
                                </div>
                            )}
                            {user.adminRejectedAt && (
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-semibold text-right">Rejected At</span>
                                    <span className="col-span-2">{new Date(user.adminRejectedAt).toLocaleString()}</span>
                                </div>
                            )}
                            {user.adminRejectionReason && (
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-semibold text-right">Rejection Reason</span>
                                    <span className="col-span-2">{user.adminRejectionReason}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; user: User | null }>({
    open: false,
    action: '',
    user: null
  })
  const [viewUserDialog, setViewUserDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  
  // Admin approval dialogs
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null
  })
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null
  })
  const [rejectionReason, setRejectionReason] = useState('')

  const handleExportUsers = () => {
    if (!users.length) return
    
    // Create CSV content
    const headers = [
      'User ID', 'Name', 'Email', 'Role', 'Status', 'Category', 'Verified', 
      'Total Bookings', 'Join Date', 'Admin Approval Status'
    ]
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.id,
        `"${user.name}"`,
        user.email,
        user.role,
        user.status,
        user.category || 'N/A',
        user.verified ? 'Yes' : 'No',
        user.totalBookings,
        new Date(user.joinDate).toLocaleDateString(),
        user.adminApprovalStatus || 'N/A'
      ].join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
        setStats(data.stats)
        setPagination(data.pagination)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error loading users')
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage, fetchUsers])

  const handleUserAction = async (action: string, user: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchUsers(currentPage)
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Error updating user')
    }
    
    setActionDialog({ open: false, action: '', user: null })
  }

  // Admin approval functions
  const handleApproveAdmin = async (user: User) => {
    try {
      const response = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Admin user ${user.name || user.email} approved successfully`)
        fetchUsers(currentPage)
      } else {
        toast.error(data.error || 'Failed to approve admin user')
      }
    } catch (error) {
      console.error('Error approving admin:', error)
      toast.error('Error approving admin user')
    }
    
    setApprovalDialog({ open: false, user: null })
  }

  const handleRejectAdmin = async (user: User, reason: string) => {
    try {
      const response = await fetch('/api/admin/users/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reason })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Admin user ${user.name || user.email} rejected`)
        fetchUsers(currentPage)
      } else {
        toast.error(data.error || 'Failed to reject admin user')
      }
    } catch (error) {
      console.error('Error rejecting admin:', error)
      toast.error('Error rejecting admin user')
    }
    
    setRejectionDialog({ open: false, user: null })
    setRejectionReason('')
  }

  const handleDeleteAdmin = async (user: User) => {
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Admin user ${user.name || user.email} deleted successfully`)
        fetchUsers(currentPage)
      } else {
        toast.error(data.error || 'Failed to delete admin user')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast.error('Error deleting admin user')
    }
    
    setDeleteDialog({ open: false, user: null })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-red-600" />
      case 'TALENT':
        return <Camera className="h-4 w-4 text-green-600" />
      case 'ORGANIZER':
        return <Building className="h-4 w-4 text-calm-soft-blue" />
      default:
        return <Users className="h-4 w-4 text-calm-dark-grey/80" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>
      case 'TALENT':
        return <Badge className="bg-green-100 text-green-800">Talent</Badge>
      case 'ORGANIZER':
        return <Badge className="bg-calm-soft-blue/20 text-blue-800">Organizer</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-calm-light-grey text-calm-dark-grey">Inactive</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getAdminApprovalBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending Approval
        </Badge>
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      default:
        return null
    }
  }

  const resetFilters = () => {
    setSearch('')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-dark-grey">User Management</h1>
          <p className="text-calm-dark-grey/80 mt-2">Manage platform users and their accounts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchUsers(currentPage)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
        </div>
      </div>

      {stats && stats.pendingAdmins > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Approvals Required
              </CardTitle>
              <Badge className="bg-yellow-100 text-yellow-800">
                {stats.pendingAdmins} pending
              </Badge>
            </div>
            <CardDescription className="text-yellow-700">
              New admin users are waiting for approval to access admin features
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-calm-dark-grey/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
            <p className="text-xs text-green-600">Platform registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Talents</CardTitle>
            <Camera className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.talentsCount?.toLocaleString() || 0}</div>
            <p className="text-xs text-green-600">
              {stats?.totalUsers ? Math.round((stats.talentsCount / stats.totalUsers) * 100) : 0}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Organizers</CardTitle>
            <Building className="h-4 w-4 text-calm-soft-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.organizersCount?.toLocaleString() || 0}</div>
            <p className="text-xs text-calm-soft-blue">
              {stats?.totalUsers ? Math.round((stats.organizersCount / stats.totalUsers) * 100) : 0}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.suspendedUsers || 0}</div>
            <p className="text-xs text-red-600">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Status</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingAdmins || 0}</div>
            <p className="text-xs text-orange-600">
              {stats?.pendingAdmins ? 'Pending approval' : 'All approved'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Users</CardTitle>
          <CardDescription>Find and manage user accounts with advanced filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search by name, email, or ID..." 
                className="pl-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="TALENT">Talents</SelectItem>
                <SelectItem value="ORGANIZER">Organizers</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Complete list of platform users 
            {pagination && ` (${pagination.total} total, page ${pagination.page} of ${pagination.pages})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-calm-dark-grey/80">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.ADMIN_USERS.icon}
              title={EMPTY_STATES.ADMIN_USERS.title}
              description={EMPTY_STATES.ADMIN_USERS.description}
              size="md"
            />
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-calm-light-grey">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-calm-dark-grey">{user.name || 'Unnamed User'}</h4>
                        {user.verified && <UserCheck className="h-4 w-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-calm-dark-grey/80">{user.email}</p>
                      <p className="text-xs text-gray-500">Joined {user.joinDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.totalBookings} bookings</p>
                      <p className="text-xs text-gray-500">{user.category}</p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                      {user.role === 'ADMIN' && getAdminApprovalBadge(user.adminApprovalStatus)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {user.role === 'ADMIN' && user.adminApprovalStatus === 'PENDING' ? (
                            <>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => setApprovalDialog({ open: true, user })}
                                >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => setRejectionDialog({ open: true, user })}
                                >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                </Button>
                            </>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setViewUserDialog({ open: true, user })}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    {user.role === 'TALENT' && (
                                        <DropdownMenuItem onClick={() => window.open(`/talent/${user.id}`, '_blank')}>
                                            <UserIcon className="mr-2 h-4 w-4" />
                                            View Public Profile
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {user.role === 'ADMIN' ? (
                                        <>
                                            {(user.adminApprovalStatus === 'APPROVED' || user.adminApprovalStatus === 'REJECTED') && (
                                            <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, user })} className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                            )}
                                        </>
                                    ) : (
                                        <DropdownMenuItem onClick={() => setActionDialog({ open: true, action: user.status === 'active' ? 'suspend' : 'activate', user })}>
                                            <UserCog className="mr-2 h-4 w-4" />
                                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-calm-dark-grey/80">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {actionDialog.action === 'suspend' ? 'Suspension' : 'Activation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.action} the account for{' '}
              <strong>{actionDialog.user?.name}</strong>? This action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionDialog.user && handleUserAction(actionDialog.action, actionDialog.user)}
              className={actionDialog.action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionDialog.action === 'suspend' ? 'Suspend User' : 'Activate User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Approval Dialogs */}
      <AlertDialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Admin User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve <strong>{approvalDialog.user?.name || approvalDialog.user?.email}</strong> as an admin user? 
              This will grant them full admin privileges and access to all admin features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approvalDialog.user && handleApproveAdmin(approvalDialog.user)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectionDialog.open} onOpenChange={(open) => setRejectionDialog({ ...rejectionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Admin User
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting <strong>{rejectionDialog.user?.name || rejectionDialog.user?.email}</strong> as an admin user.
              This reason will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea
                placeholder="Please provide a detailed reason for rejecting this admin application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectionDialog({ open: false, user: null })
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => rejectionDialog.user && handleRejectAdmin(rejectionDialog.user, rejectionReason)}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Admin User
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  Are you sure you want to <strong>permanently delete</strong> the admin user{' '}
                  <strong>{deleteDialog.user?.name || deleteDialog.user?.email}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">⚠️ Warning: This action is irreversible</p>
                  <ul className="text-red-700 text-sm mt-1 space-y-1">
                    <li>• All associated data will be permanently deleted</li>
                    <li>• This action cannot be undone</li>
                    <li>• The user will need to re-register if they want to access the platform again</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.user && handleDeleteAdmin(deleteDialog.user)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ViewUserDialog 
        user={viewUserDialog.user} 
        isOpen={viewUserDialog.open} 
        onClose={() => setViewUserDialog({ open: false, user: null })} 
      />
    </div>
  )
}

