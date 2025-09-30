'use client'

import { DashboardLayout } from '@/components/dashboard/layout'
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  DollarSign, 
  MessageSquare,
  CreditCard,
  Star,
  Settings,
  Home,
  Package,
  Gift,
  Search // Import the Search icon
} from 'lucide-react'

const talentSidebarItems = [
  {
    title: 'Homepage',
    href: '/?from=dashboard',
    icon: Home
  },
  {
    title: 'Dashboard',
    href: '/talent',
    icon: LayoutDashboard
  },
  {
    title: 'My Bookings',
    href: '/talent/bookings',
    icon: Calendar
  },
  {
    title: 'Available Events', // Added new link
    href: '/talent/events',
    icon: Search
  },
  {
    title: 'Profile',
    href: '/talent/profile',
    icon: User
  },
  {
    title: 'My Packages',
    href: '/talent/packages',
    icon: Package
  },
  {
    title: 'Earnings',
    href: '/talent/earnings',
    icon: DollarSign
  },
  {
    title: 'Refer & Earn',
    href: '/talent/referrals',
    icon: Gift
  },
  {
    title: 'Messages',
    href: '/talent/messages',
    icon: MessageSquare
  },
  {
    title: 'Payouts',
    href: '/talent/payouts',
    icon: CreditCard
  },
  {
    title: 'Reviews',
    href: '/talent/reviews',
    icon: Star
  },
  {
    title: 'Settings',
    href: '/talent/settings',
    icon: Settings
  }
]

export default function TalentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout sidebarItems={talentSidebarItems} userType="Talent">
      {children}
    </DashboardLayout>
  )
}