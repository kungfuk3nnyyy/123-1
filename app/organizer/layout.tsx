
'use client'

import { DashboardLayout } from '@/components/dashboard/layout'
import { 
  LayoutDashboard, 
  Calendar, 
  Plus, 
  MessageSquare,
  CreditCard,
  Star,
  Search,
  Settings,
  Home,
  Gift
} from 'lucide-react'

const organizerSidebarItems = [
  {
    title: 'Homepage',
    href: '/?from=dashboard',
    icon: Home
  },
  {
    title: 'Dashboard',
    href: '/organizer',
    icon: LayoutDashboard
  },
  {
    title: 'My Events',
    href: '/organizer/events',
    icon: Calendar
  },
  {
    title: 'Post New Event',
    href: '/organizer/events/new',
    icon: Plus
  },
  {
    title: 'Marketplace',
    href: '/marketplace',
    icon: Search
  },
  {
    title: 'My Bookings',
    href: '/organizer/bookings',
    icon: CreditCard
  },
  {
    title: 'Refer & Earn',
    href: '/organizer/referrals',
    icon: Gift
  },
  {
    title: 'Messages',
    href: '/organizer/messages',
    icon: MessageSquare
  },
  {
    title: 'Reviews',
    href: '/organizer/reviews',
    icon: Star
  },
  {
    title: 'Settings',
    href: '/organizer/settings',
    icon: Settings
  }
]

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout sidebarItems={organizerSidebarItems} userType="Organizer">
      {children}
    </DashboardLayout>
  )
}
