
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { AvailabilityStatus } from '@prisma/client'

interface AvailabilityEntry {
  id: string
  startDate: Date
  endDate: Date
  status: AvailabilityStatus
  notes?: string
}

interface AvailabilityDisplayProps {
  talentId: string
  startDate: Date
  endDate: Date
  compact?: boolean
}

const statusConfig = {
  [AvailabilityStatus.AVAILABLE]: {
    label: 'Available',
    icon: CheckCircle,
    color: 'text-green-600',
    badgeVariant: 'default' as const
  },
  [AvailabilityStatus.UNAVAILABLE]: {
    label: 'Unavailable',
    icon: XCircle,
    color: 'text-red-600',
    badgeVariant: 'destructive' as const
  },
  [AvailabilityStatus.BUSY]: {
    label: 'Busy',
    icon: Clock,
    color: 'text-yellow-600',
    badgeVariant: 'secondary' as const
  }
}

export function AvailabilityDisplay({ 
  talentId, 
  startDate, 
  endDate, 
  compact = false 
}: AvailabilityDisplayProps) {
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true)
        
        const response = await fetch(
          `/api/talent/availability?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&talentId=${talentId}`
        )
        
        if (response.ok) {
          const data = await response.json()
          const entries = data.data.map((entry: any) => ({
            ...entry,
            startDate: new Date(entry.startDate),
            endDate: new Date(entry.endDate)
          }))
          setAvailability(entries)
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (talentId) {
      fetchAvailability()
    }
  }, [talentId, startDate, endDate])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
    )
  }

  if (availability.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No specific availability set for this period
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {availability.map((entry) => {
          const config = statusConfig[entry.status]
          const Icon = config.icon
          
          return (
            <Badge 
              key={entry.id} 
              variant={config.badgeVariant}
              className="flex items-center space-x-1"
            >
              <Icon className="h-3 w-3" />
              <span>{config.label}</span>
            </Badge>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Calendar className="h-5 w-5" />
          <span>Availability Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availability.map((entry) => {
            const config = statusConfig[entry.status]
            const Icon = config.icon
            
            return (
              <div key={entry.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={config.badgeVariant}>
                      {config.label}
                    </Badge>
                    <span className="text-sm font-medium">
                      {entry.startDate.toLocaleDateString()} - {entry.endDate.toLocaleDateString()}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
