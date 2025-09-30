
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
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
import { Menu, X, Search, LogIn, UserPlus, LogOut, User, Settings, Users, Briefcase, UserCheck, Sparkles } from 'lucide-react'
import { GigSecureLogo } from '@/components/gigsecure-logo'

interface PublicHeaderProps {
  className?: string
}

export function PublicHeader({ className = '' }: PublicHeaderProps) {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'TALENT':
        return 'bg-green-100 text-green-800'
      case 'ORGANIZER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-calm-light-grey text-calm-dark-grey'
    }
  }

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '/admin'
      case 'TALENT':
        return '/talent'
      case 'ORGANIZER':
        return '/organizer'
      default:
        return '/auth/login'
    }
  }

  const getMarketplaceHint = (role: string) => {
    switch (role) {
      case 'TALENT':
        return { text: 'Find Work', icon: Search, color: 'text-green-600' }
      case 'ORGANIZER':
        return { text: 'Hire Talent', icon: UserCheck, color: 'text-blue-600' }
      default:
        return { text: 'Dual Mode', icon: Sparkles, color: 'text-purple-600' }
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const marketplaceHint = getMarketplaceHint(session?.user?.role || '')

  return (
    <header className={`bg-white/95 backdrop-blur-md border-b border-calm-light-grey/50 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <GigSecureLogo size="md" variant="default" href="/" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/marketplace"
              className="group flex items-center space-x-2 text-calm-dark-grey hover:text-calm-soft-blue transition-all duration-200 font-medium relative"
            >
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Marketplace</span>
              </div>
              {session && (
                <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gray-100 ${marketplaceHint.color} transition-all duration-200 group-hover:bg-gray-200`}>
                  <marketplaceHint.icon className="h-3 w-3" />
                  <span>{marketplaceHint.text}</span>
                </div>
              )}
              {!session && (
                <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-green-100 text-gray-700 transition-all duration-200 group-hover:from-blue-200 group-hover:to-green-200">
                  <Sparkles className="h-3 w-3" />
                  <span>Hire • Find Work</span>
                </div>
              )}
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3">
                <Badge className={getRoleBadgeColor(session.user.role || '')}>
                  {session.user.role}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-calm-light-grey/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ''} />
                        <AvatarFallback className="bg-calm-soft-blue/20 text-calm-dark-grey">
                          {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline-block text-sm font-medium">
                        {session.user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink(session.user.role || '')} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/marketplace" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => signIn()}
                  className="hidden sm:flex items-center space-x-1 hover:bg-calm-light-grey/50"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
                <Button 
                  onClick={() => signIn()}
                  className="bg-calm-dark-grey hover:bg-calm-dark-grey/90 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-calm-light-grey/50 py-4">
            <nav className="space-y-3">
              <Link 
                href="/marketplace"
                className="flex items-center justify-between text-calm-dark-grey hover:text-calm-soft-blue transition-colors px-3 py-2 rounded-lg hover:bg-calm-light-grey/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Marketplace</span>
                </div>
                {session && (
                  <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gray-100 ${marketplaceHint.color}`}>
                    <marketplaceHint.icon className="h-3 w-3" />
                    <span>{marketplaceHint.text}</span>
                  </div>
                )}
                {!session && (
                  <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-green-100 text-gray-700">
                    <Sparkles className="h-3 w-3" />
                    <span>Dual Mode</span>
                  </div>
                )}
              </Link>
              
              {!session && (
                <div className="px-3 pt-2 space-y-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      signIn()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-start hover:bg-calm-light-grey/50"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => {
                      signIn()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full bg-calm-dark-grey hover:bg-calm-dark-grey/90"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
