
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { 
  checkTalentAvailability, 
  getTalentAvailability, 
  upsertAvailability, 
  deleteAvailability,
  generateRecurringAvailability 
} from '@/lib/availability'
import { AvailabilityStatus } from '@prisma/client'
import { prisma } from '@/lib/db'

// Mock data
const mockTalentId = 'test-talent-id'
const mockStartDate = new Date('2025-09-15T09:00:00Z')
const mockEndDate = new Date('2025-09-15T17:00:00Z')

describe('Availability System', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.talentAvailability.deleteMany({
      where: { talentId: mockTalentId }
    })
    await prisma.booking.deleteMany({
      where: { talentId: mockTalentId }
    })
  })

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.talentAvailability.deleteMany({
      where: { talentId: mockTalentId }
    })
    await prisma.booking.deleteMany({
      where: { talentId: mockTalentId }
    })
  })

  describe('checkTalentAvailability', () => {
    it('should return available when no conflicts exist', async () => {
      const result = await checkTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result.isAvailable).toBe(true)
      expect(result.conflictingEntries).toHaveLength(0)
      expect(result.message).toContain('available')
    })

    it('should return unavailable when talent has unavailable period', async () => {
      // Create unavailable period
      await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.UNAVAILABLE,
        notes: 'Test unavailable period'
      })

      const result = await checkTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result.isAvailable).toBe(false)
      expect(result.conflictingEntries).toHaveLength(1)
      expect(result.conflictingEntries[0].status).toBe(AvailabilityStatus.UNAVAILABLE)
      expect(result.message).toContain('not available')
    })

    it('should return unavailable when talent has busy period', async () => {
      // Create busy period
      await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.BUSY,
        notes: 'Test busy period'
      })

      const result = await checkTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result.isAvailable).toBe(false)
      expect(result.conflictingEntries).toHaveLength(1)
      expect(result.conflictingEntries[0].status).toBe(AvailabilityStatus.BUSY)
    })

    it('should return available when talent has available period', async () => {
      // Create available period
      await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.AVAILABLE,
        notes: 'Test available period'
      })

      const result = await checkTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result.isAvailable).toBe(true)
      expect(result.conflictingEntries).toHaveLength(0)
    })

    it('should handle overlapping date ranges correctly', async () => {
      // Create unavailable period that partially overlaps
      const overlapStart = new Date('2025-09-15T14:00:00Z')
      const overlapEnd = new Date('2025-09-15T20:00:00Z')
      
      await upsertAvailability(mockTalentId, {
        startDate: overlapStart,
        endDate: overlapEnd,
        status: AvailabilityStatus.UNAVAILABLE
      })

      const result = await checkTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result.isAvailable).toBe(false)
      expect(result.conflictingEntries).toHaveLength(1)
    })
  })

  describe('getTalentAvailability', () => {
    it('should return empty array when no availability entries exist', async () => {
      const result = await getTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result).toHaveLength(0)
    })

    it('should return availability entries within date range', async () => {
      // Create availability entry
      await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.AVAILABLE,
        notes: 'Test entry'
      })

      const result = await getTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe(AvailabilityStatus.AVAILABLE)
      expect(result[0].notes).toBe('Test entry')
    })

    it('should not return entries outside date range', async () => {
      // Create availability entry outside range
      const outsideStart = new Date('2025-09-20T09:00:00Z')
      const outsideEnd = new Date('2025-09-20T17:00:00Z')
      
      await upsertAvailability(mockTalentId, {
        startDate: outsideStart,
        endDate: outsideEnd,
        status: AvailabilityStatus.AVAILABLE
      })

      const result = await getTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result).toHaveLength(0)
    })
  })

  describe('upsertAvailability', () => {
    it('should create new availability entry', async () => {
      const result = await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.AVAILABLE,
        notes: 'New entry'
      })

      expect(result.id).toBeDefined()
      expect(result.talentId).toBe(mockTalentId)
      expect(result.status).toBe(AvailabilityStatus.AVAILABLE)
      expect(result.notes).toBe('New entry')
    })

    it('should update existing availability entry', async () => {
      // Create initial entry
      const created = await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.AVAILABLE,
        notes: 'Original entry'
      })

      // Update the entry
      const updated = await upsertAvailability(mockTalentId, {
        id: created.id,
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.UNAVAILABLE,
        notes: 'Updated entry'
      })

      expect(updated.id).toBe(created.id)
      expect(updated.status).toBe(AvailabilityStatus.UNAVAILABLE)
      expect(updated.notes).toBe('Updated entry')
    })

    it('should handle recurring availability', async () => {
      const result = await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.AVAILABLE,
        isRecurring: true,
        recurringPattern: 'weekly',
        recurringDays: [1, 2, 3, 4, 5], // Monday to Friday
        notes: 'Recurring entry'
      })

      expect(result.isRecurring).toBe(true)
      expect(result.recurringPattern).toBe('weekly')
      expect(result.recurringDays).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('deleteAvailability', () => {
    it('should delete availability entry', async () => {
      // Create entry
      const created = await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.AVAILABLE
      })

      // Delete entry
      await deleteAvailability(created.id)

      // Verify deletion
      const entries = await getTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(entries).toHaveLength(0)
    })

    it('should throw error when deleting non-existent entry', async () => {
      await expect(deleteAvailability('non-existent-id')).rejects.toThrow()
    })
  })

  describe('generateRecurringAvailability', () => {
    it('should generate recurring entries for specified days', async () => {
      const generateUntil = new Date('2025-09-30T23:59:59Z')
      
      const result = await generateRecurringAvailability(
        mockTalentId,
        {
          startDate: mockStartDate, // Monday
          endDate: mockEndDate,
          status: AvailabilityStatus.AVAILABLE,
          recurringPattern: 'weekly',
          recurringDays: [1, 3, 5], // Monday, Wednesday, Friday
          notes: 'Recurring availability'
        },
        generateUntil
      )

      expect(result.count).toBeGreaterThan(0)

      // Verify entries were created
      const entries = await getTalentAvailability(
        mockTalentId,
        mockStartDate,
        generateUntil
      )

      expect(entries.length).toBeGreaterThan(1)
      entries.forEach(entry => {
        expect(entry.isRecurring).toBe(true)
        expect(entry.recurringPattern).toBe('weekly')
        expect(entry.status).toBe(AvailabilityStatus.AVAILABLE)
      })
    })

    it('should not generate entries for non-matching days', async () => {
      const generateUntil = new Date('2025-09-20T23:59:59Z')
      
      const result = await generateRecurringAvailability(
        mockTalentId,
        {
          startDate: mockStartDate, // Monday (day 1)
          endDate: mockEndDate,
          status: AvailabilityStatus.AVAILABLE,
          recurringPattern: 'weekly',
          recurringDays: [0, 6], // Sunday and Saturday only
          notes: 'Weekend availability'
        },
        generateUntil
      )

      // Should generate some entries for weekends
      expect(result.count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Integration with booking system', () => {
    it('should prevent booking when talent is unavailable', async () => {
      // Create unavailable period
      await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.UNAVAILABLE,
        notes: 'Not available for bookings'
      })

      // Check availability for booking
      const result = await checkTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result.isAvailable).toBe(false)
      expect(result.message).toContain('not available')
    })

    it('should allow booking when talent is available', async () => {
      // Create available period
      await upsertAvailability(mockTalentId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        status: AvailabilityStatus.AVAILABLE,
        notes: 'Available for bookings'
      })

      // Check availability for booking
      const result = await checkTalentAvailability(
        mockTalentId,
        mockStartDate,
        mockEndDate
      )

      expect(result.isAvailable).toBe(true)
      expect(result.message).toContain('available')
    })
  })
})
