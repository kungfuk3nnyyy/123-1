
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { AvailabilityStatus } from '@prisma/client'

interface AvailabilityEntry {
  id: string
  startDate: Date
  endDate: Date
  status: AvailabilityStatus
  notes?: string
}

interface AvailabilityCheck {
  isAvailable: boolean
  conflictingEntries: AvailabilityEntry[]
  message: string
}

interface AvailabilityCheckerProps {
  talentId: string
  startDate: Date
  endDate: Date
  onAvailabilityChange?: (isAvailable: boolean) => void
}

const statusConfig = {
  [AvailabilityStatus.AVAILABLE]: {
    label: 'Available',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  [AvailabilityStatus.UNAVAILABLE]: {
    label: 'Unavailable',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200'
  },
  [AvailabilityStatus.BUSY]: {
    label: 'Busy',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200'
  }
}

export function AvailabilityChecker({ 
  talentId, 
  startDate, 
  endDate, 
  onAvailabilityChange 
}: AvailabilityCheckerProps) {
  const [availabilityCheck, setAvailabilityCheck] = useState<AvailabilityCheck | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = async () => {
    if (!talentId || !startDate || !endDate) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/availability/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          talentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        const check = {
          ...data.data,
          conflictingEntries: data.data.conflictingEntries.map((entry: any) => ({
            ...entry,
            startDate: new Date(entry.startDate),
            endDate: new Date(entry.endDate)
          }))
        }
        setAvailabilityCheck(check)
        onAvailabilityChange?.(check.isAvailable)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to check availability')
      }
    } catch (err) {
      console.error('Error checking availability:', err)
      setError('Failed to check availability')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAvailability()
  }, [talentId, startDate, endDate])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Checking Availability...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={checkAvailability}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!availabilityCheck) {
    return null
  }

  const { isAvailable, conflictingEntries, message } = availabilityCheck

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Talent Availability</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Availability Status */}
          <div className="flex items-center space-x-3">
            {isAvailable ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">Available</p>
                  <p className="text-sm text-muted-foreground">{message}</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-600">Not Available</p>
                  <p className="text-sm text-muted-foreground">{message}</p>
                </div>
              </>
            )}
          </div>

          {/* Conflicting Entries */}
          {conflictingEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Conflicts:</h4>
              {conflictingEntries.map((entry) => {
                const config = statusConfig[entry.status]
                const Icon = config.icon
                
                return (
                  <div 
                    key={entry.id} 
                    className={`p-3 rounded-lg border ${config.bgColor}`}
                  >
                    <div className="flex items-start space-x-2">
                      <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                          <span className="text-sm font-medium">
                            {entry.startDate.toLocaleDateString()} - {entry.endDate.toLocaleDateString()}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkAvailability}
            disabled={isLoading}
          >
            Refresh Availability
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
