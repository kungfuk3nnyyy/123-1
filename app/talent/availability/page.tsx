
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { TalentCalendar } from '@/components/calendar/talent-calendar'
import { AvailabilityLegend } from '@/components/calendar/availability-legend'

export default function TalentAvailabilityPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== UserRole.TALENT) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Availability Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your availability to prevent booking conflicts and streamline the booking process.
          </p>
        </div>

        {/* Legend */}
        <AvailabilityLegend />

        {/* Calendar */}
        <TalentCalendar />
      </div>
    </div>
  )
}
