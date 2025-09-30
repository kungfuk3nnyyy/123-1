import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  action?: EmptyStateAction
}

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  className,
  size = 'md',
  action
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size],
      className
    )}>
      <div className={cn(
        'flex items-center justify-center rounded-full bg-muted',
        size === 'sm' ? 'h-12 w-12' : size === 'md' ? 'h-16 w-16' : 'h-20 w-20'
      )}>
        <Icon className={cn(
          'text-muted-foreground',
          size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10'
        )} />
      </div>
      <h3 className={cn(
        'font-medium',
        size === 'sm' ? 'mt-3 text-base' : size === 'md' ? 'mt-4 text-lg' : 'mt-5 text-xl'
      )}>
        {title}
      </h3>
      <p className={cn(
        'text-muted-foreground',
        size === 'sm' ? 'mt-1 text-xs' : size === 'md' ? 'mt-2 text-sm' : 'mt-3 text-base'
      )}>
        {description}
      </p>
      {action && (
        <Button 
          variant="outline" 
          className={size === 'sm' ? 'mt-3' : 'mt-4'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
