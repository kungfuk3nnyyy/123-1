
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { BookingStatus } from '@prisma/client'
import { 
  MessageSquare, 
  CreditCard, 
  Calendar, 
  Star, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface BookingProgressTrackerProps {
  status: BookingStatus
  eventDate?: Date | string
  className?: string
  createdAt?: Date | string | null
  acceptedDate?: Date | string | null
  completedDate?: Date | string | null
}

interface ProgressStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'upcoming'
}

export default function BookingProgressTracker({ 
  status, 
  eventDate, 
  className,
  createdAt,
  acceptedDate,
  completedDate
}: BookingProgressTrackerProps) {
  
  const getProgressSteps = (): ProgressStep[] => {
    const eventDateObj = eventDate ? new Date(eventDate) : null
    const now = new Date()
    const isEventInFuture = eventDateObj ? eventDateObj > now : true

    const steps: ProgressStep[] = [
      {
        id: 1,
        title: 'Request Sent',
        description: 'Booking request sent. Awaiting acceptance from the talent.',
        icon: <MessageSquare className="h-5 w-5" />,
        status: 'upcoming'
      },
      {
        id: 2,
        title: 'Secure Payment',
        description: 'Request accepted! Awaiting secure payment from the organizer.',
        icon: <CreditCard className="h-5 w-5" />,
        status: 'upcoming'
      },
      {
        id: 3,
        title: 'Event Scheduled',
        description: 'Payment successful! The event is officially booked and scheduled.',
        icon: <Calendar className="h-5 w-5" />,
        status: 'upcoming'
      },
      {
        id: 4,
        title: 'Complete & Review',
        description: 'Event finished! Please leave a review. Payout is being processed for the talent.',
        icon: <Star className="h-5 w-5" />,
        status: 'upcoming'
      }
    ]

    // Update step statuses based on booking status
    switch (status) {
      case BookingStatus.PENDING:
        if (steps[0]) {
          steps[0].status = 'current'
        }
        break
      
      case BookingStatus.ACCEPTED:
        if (steps[0] && steps[1]) {
          steps[0].status = 'completed'
          steps[1].status = 'current'
        }
        break
      
      case BookingStatus.IN_PROGRESS:
        if (steps[0] && steps[1] && steps[2]) {
          steps[0].status = 'completed'
          steps[1].status = 'completed'
          if (isEventInFuture) {
            steps[2].status = 'current'
          } else {
            steps[2].status = 'completed'
            if (steps[3]) {
              steps[3].status = 'current'
            }
          }
        }
        break
      
      case BookingStatus.COMPLETED:
        steps.forEach((step, index) => {
          if (step) {
            step.status = 'completed'
          }
        })
        break
      
      case BookingStatus.CANCELLED:
      case BookingStatus.DECLINED:
        // For cancelled/declined bookings, show where it stopped
        if (status === BookingStatus.DECLINED) {
          // Ensure first step exists before modifying
          if (steps[0]) {
            steps[0].status = 'current'
            steps[0].description = 'Booking request was declined by the talent.'
            steps[0].icon = <AlertCircle className="h-5 w-5" />
          }
        } else {
          // Cancelled - could happen at any stage
          const currentStepIndex = steps.findIndex(s => s?.status === 'current')
          const cancelledAtStep = currentStepIndex !== -1 ? currentStepIndex : 0
          
          // Ensure we have a valid step before setting properties
          if (steps[cancelledAtStep]) {
            steps[cancelledAtStep].description = 'Booking was cancelled.'
            steps[cancelledAtStep].icon = <AlertCircle className="h-5 w-5" />
          }
        }
        break
      
      default:
        break
    }

    return steps
  }

  const steps = getProgressSteps()

  const getStepIconClasses = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500'
      case 'current':
        return 'bg-calm-soft-blue/100 text-white border-blue-500'
      case 'upcoming':
        return 'bg-gray-200 text-gray-500 border-gray-300'
      default:
        return 'bg-gray-200 text-gray-500 border-gray-300'
    }
  }

  const getStepTextClasses = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-green-600'
      case 'current':
        return 'text-calm-soft-blue'
      case 'upcoming':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const getConnectorClasses = (currentStep: ProgressStep, nextStep?: ProgressStep) => {
    if (currentStep.status === 'completed') {
      return 'bg-green-500'
    }
    return 'bg-gray-300'
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-300">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-in-out"
            style={{
              width: `${((steps.filter(s => s.status === 'completed').length) / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center min-w-0 flex-1">
              {/* Step Icon */}
              <div 
                className={cn(
                  'relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300',
                  getStepIconClasses(step.status)
                )}
              >
                {step.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : step.status === 'current' ? (
                  <Clock className="h-6 w-6" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Content */}
              <div className="mt-4 text-center max-w-xs">
                <h3 className={cn(
                  'text-sm font-semibold mb-1 transition-colors duration-300',
                  getStepTextClasses(step.status)
                )}>
                  {step.title}
                </h3>
                <p className={cn(
                  'text-xs leading-relaxed transition-colors duration-300',
                  step.status === 'current' ? 'text-calm-dark-grey' : 'text-gray-500'
                )}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
