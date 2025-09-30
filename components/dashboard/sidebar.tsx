'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Menu,
  LucideIcon,
  LayoutDashboard,
  Calendar,
  Package,
  Star,
  MessageSquare,
  User,
  Settings,
  CreditCard,
  Wallet,
  Gift,
  ShieldCheck,
  Globe,
  LogOut,
  PlusCircle,
  BarChart,
  Users,
  FileCheck,
  ArrowRightLeft,
  Bell,
} from 'lucide-react'
import { GigSecureLogo } from '@/components/gigsecure-logo'

interface SidebarItem {
  title: string
  href: string
  icon: LucideIcon
}

// This function dynamically generates navigation links based on user role
const getNavLinks = (role: string, userId: string): SidebarItem[] => {
  if (role === 'ADMIN') {
    return [
      { href: '/admin', title: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', title: 'Analytics', icon: BarChart },
      { href: '/admin/users', title: 'Users', icon: Users },
      { href: '/admin/kyc-submissions', title: 'KYC Submissions', icon: FileCheck },
      { href: '/admin/bookings', title: 'Bookings', icon: Calendar },
      { href: '/admin/packages', title: 'Packages', icon: Package },
      { href: '/admin/transactions', title: 'Transactions', icon: ArrowRightLeft },
      { href: '/admin/payouts', title: 'Payouts', icon: CreditCard },
      { href: '/admin/disputes', title: 'Disputes', icon: ShieldCheck },
      { href: '/admin/referrals', title: 'Referrals', icon: Gift },
      { href: '/admin/notifications', title: 'Notifications', icon: Bell },
      { href: '/admin/settings', title: 'Settings', icon: Settings },
    ];
  }

  const baseLinks = [
    { href: `/${role.toLowerCase()}`, title: 'Dashboard', icon: LayoutDashboard },
    { href: `/${role.toLowerCase()}/bookings`, title: 'Bookings', icon: Calendar },
  ];

  if (role === 'TALENT') {
    return [
      ...baseLinks,
      { href: '/talent/availability', title: 'Availability', icon: Calendar },
      { href: '/talent/packages', title: 'Packages', icon: Package },
      { href: '/talent/reviews', title: 'Reviews', icon: Star },
      { href: '/talent/messages', title: 'Messages', icon: MessageSquare },
      { href: '/talent/earnings', title: 'Earnings', icon: Wallet },
      { href: '/talent/payouts', title: 'Payouts', icon: CreditCard },
      { href: '/talent/disputes', title: 'Disputes', icon: ShieldCheck },
      { href: '/talent/referrals', title: 'Referrals', icon: Gift },
      { href: `/talent/${userId}`, title: 'My Public Profile', icon: Globe },
      { href: '/talent/profile', title: 'Edit Profile', icon: User },
      { href: '/talent/settings', title: 'Settings', icon: Settings },
    ];
  }

  // UPDATED: Organizer links now include "Create New Event" and "Profile"
  if (role === 'ORGANIZER') {
     return [
      ...baseLinks,
      { href: '/organizer/events', title: 'Events', icon: Calendar },
      // --- NEWLY ADDED LINK ---
      { href: '/organizer/events/new', title: 'Create New Event', icon: PlusCircle },
      // ------------------------
      { href: '/organizer/reviews', title: 'Reviews', icon: Star },
      { href: '/organizer/messages', title: 'Messages', icon: MessageSquare },
      { href: '/organizer/disputes', title: 'Disputes', icon: ShieldCheck },
      { href: '/organizer/referrals', title: 'Referrals', icon: Gift },
      { href: '/organizer/profile', title: 'Profile', icon: User },
      { href: '/organizer/settings', title: 'Settings', icon: Settings },
    ];
  }

  return [];
};


export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const role = session?.user?.role
  const userId = session?.user?.id
  const userType = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : ''
  
  // Return null or a loading skeleton if session data is not yet available
  if (!role || !userId) {
    return null; 
  }

  const items = getNavLinks(role, userId);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b">
        <GigSecureLogo />
        <div className="mt-4">
          <p className="text-sm font-semibold">{userType} Dashboard</p>
          <p className="text-xs text-muted-foreground mt-1">Professional Event Services</p>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all hover:bg-muted',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
       <div className="mt-auto p-4 border-t">
           <Button variant="ghost" className="w-full justify-start" onClick={() => signOut({ callbackUrl: '/' })}>
             <LogOut className="mr-2 h-4 w-4" />
             Logout
           </Button>
        </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="lg:hidden" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}

