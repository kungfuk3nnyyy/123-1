
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AvailabilityStatus } from '@prisma/client'
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'

const statusConfig = {
  [AvailabilityStatus.AVAILABLE]: {
    label: 'Available',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Open for bookings'
  },
  [AvailabilityStatus.UNAVAILABLE]: {
    label: 'Unavailable',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Not available for bookings'
  },
  [AvailabilityStatus.BUSY]: {
    label: 'Busy',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Tentatively booked or busy'
  }
}

interface AvailabilityLegendProps {
  showDescription?: boolean
  compact?: boolean
}

export function AvailabilityLegend({ showDescription = true, compact = false }: AvailabilityLegendProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon
          return (
            <div key={status} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${config.color}`} />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Availability Status Legend</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon
            return (
              <div key={status} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium">{config.label}</h4>
                  {showDescription && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {showDescription && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">How to use:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Click on any date to add availability</li>
              <li>• Click on existing entries to edit or delete them</li>
              <li>• Use recurring availability for regular schedules</li>
              <li>• Organizers can only book during available periods</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
