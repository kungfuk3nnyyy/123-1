
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3'
    },
    md: {
      container: 'py-12',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      container: 'py-16',
      icon: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`text-center ${currentSize.container} ${className}`}
    >
      <div className={`flex flex-col items-center ${currentSize.spacing}`}>
        {Icon && (
          <div className="text-slate-400 mb-2">
            <Icon className={`${currentSize.icon} mx-auto`} />
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className={`font-semibold text-slate-600 ${currentSize.title}`}>
            {title}
          </h3>
          <p className={`text-slate-500 max-w-md mx-auto leading-relaxed ${currentSize.description}`}>
            {description}
          </p>
        </div>

        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="mt-2"
          >
            {action.label}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// Wrapper for card-based empty states
export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className = '',
  size = 'md'
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed border-2 border-slate-200 bg-slate-50/50 ${className}`}>
      <CardContent className="p-0">
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          action={action}
          size={size}
        />
      </CardContent>
    </Card>
  )
}
