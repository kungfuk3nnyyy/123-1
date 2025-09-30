
'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Settings, LogOut, User, Users } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { GigSecureLogo } from '@/components/gigsecure-logo'
import { UserRole } from '@prisma/client'

export function DashboardHeader() {
  const { data: session } = useSession()

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-calm-danger-light text-calm-danger-dark'
      case UserRole.TALENT:
        return 'bg-calm-success-light text-calm-success-dark'
      case UserRole.ORGANIZER:
        return 'bg-calm-soft-blue-light text-calm-soft-blue-dark'
      default:
        return 'bg-calm-light-grey text-calm-dark-grey'
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="h-16 border-b border-calm-light-grey bg-calm-white flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <GigSecureLogo size="md" variant="default" href="/" />
        <div className="hidden sm:flex items-center gap-3">
          <h1 className="text-lg font-semibold text-calm-dark-grey">
            Welcome back, {session?.user.name}
          </h1>
          <Badge className={getRoleBadgeColor(session?.user.role || '')}>
            {session?.user.role}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-calm-light-grey-light">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user.image || ''} />
                <AvatarFallback>
                  {session?.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-medium">
                {session?.user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <a href="/marketplace" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Marketplace
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/talent/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-calm-danger hover:text-calm-danger-dark hover:bg-calm-danger-light/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
