
'use client'

import { DashboardLayout } from '@/components/dashboard/layout'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Settings,
  BarChart3,
  Shield,
  Home,
  Package,
  Gift
} from 'lucide-react'

const adminSidebarItems = [
  {
    title: 'Homepage',
    href: '/?from=dashboard',
    icon: Home
  },
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'Package Management',
    href: '/admin/packages',
    icon: Package
  },
  {
    title: 'Booking Management',
    href: '/admin/bookings',
    icon: Calendar
  },
  {
    title: 'KYC Submissions',
    href: '/admin/kyc-submissions',
    icon: Shield
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard
  },
  {
    title: 'Payouts',
    href: '/admin/payouts',
    icon: DollarSign
  },
  {
    title: 'Referral Program',
    href: '/admin/referrals',
    icon: Gift
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    title: 'Platform Settings',
    href: '/admin/settings',
    icon: Settings
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout sidebarItems={adminSidebarItems} userType="Admin">
      {children}
    </DashboardLayout>
  )
}
