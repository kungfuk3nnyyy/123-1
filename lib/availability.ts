
import { prisma } from '@/lib/db'
import { AvailabilityStatus } from '@prisma/client'

export interface AvailabilityEntry {
  id: string
  startDate: Date
  endDate: Date
  status: AvailabilityStatus
  isRecurring: boolean
  recurringPattern?: string
  recurringDays?: number[]
  notes?: string
}

export interface AvailabilityCheck {
  isAvailable: boolean
  conflictingEntries: AvailabilityEntry[]
  message: string
}

/**
 * Check if a talent is available for a specific date range
 */
export async function checkTalentAvailability(
  talentId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilityCheck> {
  try {
    // Find overlapping availability entries
    const overlappingEntries = await prisma.talentAvailability.findMany({
      where: {
        talentId,
        OR: [
          {
            // Entry starts before our range ends and ends after our range starts
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } }
            ]
          }
        ]
      },
      orderBy: { startDate: 'asc' }
    })

    // Check for unavailable or busy periods
    const conflictingEntries = overlappingEntries.filter(
      entry => entry.status === AvailabilityStatus.UNAVAILABLE || 
               entry.status === AvailabilityStatus.BUSY
    )

    // Check for existing bookings in the date range with optimized query
    const existingBookings = await prisma.booking.findMany({
      where: {
        talentId,
        status: {
          in: ['ACCEPTED', 'IN_PROGRESS', 'PENDING']
        },
        OR: [
          {
            // Check proposed date overlaps
            proposedDate: { not: null },
            proposedDate: { lt: endDate },
            OR: [
              { eventEndDateTime: { gt: startDate } },
              { 
                eventEndDateTime: null,
                proposedDate: { gte: startDate }
              }
            ]
          },
          {
            // Check accepted date overlaps
            acceptedDate: { not: null },
            acceptedDate: { lt: endDate },
            OR: [
              { eventEndDateTime: { gt: startDate } },
              { 
                eventEndDateTime: null,
                acceptedDate: { gte: startDate }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        status: true,
        proposedDate: true,
        acceptedDate: true,
        eventEndDateTime: true
      }
    })

    const hasBookingConflict = existingBookings.length > 0
    const hasAvailabilityConflict = conflictingEntries.length > 0

    const isAvailable = !hasBookingConflict && !hasAvailabilityConflict

    let message = ''
    if (!isAvailable) {
      if (hasBookingConflict) {
        message = 'Talent has existing bookings during this period'
      } else if (hasAvailabilityConflict) {
        message = 'Talent is not available during this period'
      }
    } else {
      message = 'Talent is available for this period'
    }

    return {
      isAvailable,
      conflictingEntries: conflictingEntries.map(entry => ({
        id: entry.id,
        startDate: entry.startDate,
        endDate: entry.endDate,
        status: entry.status,
        isRecurring: entry.isRecurring,
        recurringPattern: entry.recurringPattern || undefined,
        recurringDays: entry.recurringDays,
        notes: entry.notes || undefined
      })),
      message
    }
  } catch (error) {
    console.error('Error checking talent availability:', error)
    return {
      isAvailable: false,
      conflictingEntries: [],
      message: 'Error checking availability'
    }
  }
}

/**
 * Get talent availability for a date range
 */
export async function getTalentAvailability(
  talentId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilityEntry[]> {
  try {
    const entries = await prisma.talentAvailability.findMany({
      where: {
        talentId,
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } }
            ]
          }
        ]
      },
      orderBy: { startDate: 'asc' }
    })

    return entries.map(entry => ({
      id: entry.id,
      startDate: entry.startDate,
      endDate: entry.endDate,
      status: entry.status,
      isRecurring: entry.isRecurring,
      recurringPattern: entry.recurringPattern || undefined,
      recurringDays: entry.recurringDays,
      notes: entry.notes || undefined
    }))
  } catch (error) {
    console.error('Error getting talent availability:', error)
    return []
  }
}

/**
 * Create or update availability entry
 */
export async function upsertAvailability(
  talentId: string,
  data: {
    id?: string
    startDate: Date
    endDate: Date
    status: AvailabilityStatus
    isRecurring?: boolean
    recurringPattern?: string
    recurringDays?: number[]
    notes?: string
  }
) {
  try {
    if (data.id) {
      // Update existing entry
      return await prisma.talentAvailability.update({
        where: { id: data.id },
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          isRecurring: data.isRecurring || false,
          recurringPattern: data.recurringPattern,
          recurringDays: data.recurringDays || [],
          notes: data.notes
        }
      })
    } else {
      // Create new entry
      return await prisma.talentAvailability.create({
        data: {
          talentId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          isRecurring: data.isRecurring || false,
          recurringPattern: data.recurringPattern,
          recurringDays: data.recurringDays || [],
          notes: data.notes
        }
      })
    }
  } catch (error) {
    console.error('Error upserting availability:', error)
    throw error
  }
}

/**
 * Delete availability entry
 */
export async function deleteAvailability(entryId: string) {
  try {
    return await prisma.talentAvailability.delete({
      where: { id: entryId }
    })
  } catch (error) {
    console.error('Error deleting availability:', error)
    throw error
  }
}

/**
 * Generate recurring availability entries
 */
export async function generateRecurringAvailability(
  talentId: string,
  baseEntry: {
    startDate: Date
    endDate: Date
    status: AvailabilityStatus
    recurringPattern: string
    recurringDays: number[]
    notes?: string
  },
  generateUntil: Date
) {
  const entries = []
  const currentDate = new Date(baseEntry.startDate)
  
  // Ensure we don't create infinite loops
  const maxIterations = 1000
  let iterations = 0
  
  while (currentDate <= generateUntil && iterations < maxIterations) {
    // Check if current date matches recurring pattern
    const dayOfWeek = currentDate.getDay()
    
    if (baseEntry.recurringDays.includes(dayOfWeek)) {
      // Calculate the start and end times for this occurrence
      const entryStartDate = new Date(currentDate)
      entryStartDate.setHours(baseEntry.startDate.getHours(), baseEntry.startDate.getMinutes(), 0, 0)
      
      const entryEndDate = new Date(currentDate)
      entryEndDate.setHours(baseEntry.endDate.getHours(), baseEntry.endDate.getMinutes(), 0, 0)
      
      // If end time is before start time, it means it goes to the next day
      if (entryEndDate <= entryStartDate) {
        entryEndDate.setDate(entryEndDate.getDate() + 1)
      }
      
      entries.push({
        talentId,
        startDate: entryStartDate,
        endDate: entryEndDate,
        status: baseEntry.status,
        isRecurring: true,
        recurringPattern: baseEntry.recurringPattern,
        recurringDays: baseEntry.recurringDays,
        notes: baseEntry.notes
      })
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
    iterations++
  }
  
  // Bulk create entries
  if (entries.length > 0) {
    return await prisma.talentAvailability.createMany({
      data: entries,
      skipDuplicates: true
    })
  }
  
  return { count: 0 }
}
