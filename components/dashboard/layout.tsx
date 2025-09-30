
'use client'

import { Sidebar } from './sidebar'
import { DashboardHeader } from './header'
import { LucideIcon } from 'lucide-react'

interface SidebarItem {
  title: string
  href: string
  icon: LucideIcon
}

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebarItems: SidebarItem[]
  userType: string
}

export function DashboardLayout({ children, sidebarItems, userType }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-calm-light-grey">
      <Sidebar items={sidebarItems} userType={userType} />
      
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
