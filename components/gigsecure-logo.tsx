
'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Shield, CheckCircle } from 'lucide-react'

interface GigSecureLogoProps {
  variant?: 'default' | 'white' | 'dark' | 'sidebar'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  href?: string
  className?: string
}

export function GigSecureLogo({ 
  variant = 'default', 
  size = 'md', 
  showText = true, 
  href = '/',
  className = '' 
}: GigSecureLogoProps) {
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'white':
        return {
          containerClass: 'text-white',
          iconBg: 'bg-white/20 backdrop-blur-sm border border-white/30',
          iconColor: 'text-white',
          textColor: 'text-white'
        }
      case 'dark':
        return {
          containerClass: 'text-calm-dark-grey',
          iconBg: 'bg-calm-dark-grey/10 border border-calm-dark-grey/20',
          iconColor: 'text-calm-dark-grey',
          textColor: 'text-calm-dark-grey'
        }
      case 'sidebar':
        return {
          containerClass: 'text-calm-dark-grey',
          iconBg: 'bg-calm-soft-blue/20 border border-calm-soft-blue/30',
          iconColor: 'text-calm-soft-blue',
          textColor: 'text-calm-dark-grey'
        }
      default:
        return {
          containerClass: 'text-calm-dark-grey',
          iconBg: 'bg-gradient-to-br from-calm-soft-blue to-calm-dark-grey',
          iconColor: 'text-white',
          textColor: 'text-calm-dark-grey'
        }
    }
  }

  const styles = getVariantStyles()

  const LogoContent = () => (
    <div className={cn('flex items-center space-x-3', styles.containerClass, className)}>
      <div className={cn(
        'rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl',
        sizeClasses[size],
        styles.iconBg
      )}>
        <Shield className={cn('h-1/2 w-1/2', styles.iconColor)} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className={cn('font-bold leading-tight', textSizeClasses[size], styles.textColor)}>
            Gig<span className="text-calm-warm-beige">Secure</span>
          </div>
          {size === 'lg' || size === 'xl' ? (
            <div className="text-xs text-calm-dark-grey/60 font-medium">
              Professional Event Services
            </div>
          ) : null}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
