
'use client'

import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import { CalendarIcon, Plus, Edit, Trash2, Clock, AlertCircle } from 'lucide-react'
import { AvailabilityStatus } from '@prisma/client'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface AvailabilityEntry {
  id: string
  startDate: Date
  endDate: Date
  status: AvailabilityStatus
  isRecurring: boolean
  recurringPattern?: string
  recurringDays?: number[]
  notes?: string
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: AvailabilityEntry
}

const statusColors = {
  [AvailabilityStatus.AVAILABLE]: 'bg-green-100 text-green-800 border-green-200',
  [AvailabilityStatus.UNAVAILABLE]: 'bg-red-100 text-red-800 border-red-200',
  [AvailabilityStatus.BUSY]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const statusLabels = {
  [AvailabilityStatus.AVAILABLE]: 'Available',
  [AvailabilityStatus.UNAVAILABLE]: 'Unavailable',
  [AvailabilityStatus.BUSY]: 'Busy',
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function TalentCalendar() {
  const [availabilityEntries, setAvailabilityEntries] = useState<AvailabilityEntry[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [selectedEntry, setSelectedEntry] = useState<AvailabilityEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Form state type
  type FormData = {
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'BUSY'
    isRecurring: boolean
    recurringPattern: 'weekly' | 'biweekly' | 'monthly'
    recurringDays: number[]
    notes: string
    generateUntil: string
  }

  const [formData, setFormData] = useState<FormData>({
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    status: 'AVAILABLE',
    isRecurring: false,
    recurringPattern: 'weekly',
    recurringDays: [],
    notes: '',
    generateUntil: ''
  })

  // Fetch availability data
  const fetchAvailability = async () => {
    try {
      setIsLoading(true)
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const response = await fetch(
        `/api/talent/availability?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const entries = data.data.map((entry: any) => ({
          ...entry,
          startDate: new Date(entry.startDate),
          endDate: new Date(entry.endDate)
        }))
        setAvailabilityEntries(entries)
        
        // Convert to calendar events
        const events = entries.map((entry: AvailabilityEntry) => ({
          id: entry.id,
          title: statusLabels[entry.status],
          start: entry.startDate,
          end: entry.endDate,
          resource: entry
        }))
        setCalendarEvents(events)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch availability data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
  }, [currentDate])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)
      
      // Validate dates
      if (startDateTime >= endDateTime) {
        toast({
          title: 'Error',
          description: 'End date and time must be after start date and time',
          variant: 'destructive'
        })
        setIsLoading(false)
        return
      }
      
      // Validate recurring settings
      if (formData.isRecurring) {
        if (formData.recurringDays.length === 0) {
          toast({
            title: 'Error',
            description: 'Please select at least one day for recurring availability',
            variant: 'destructive'
          })
          setIsLoading(false)
          return
        }
        
        if (!formData.generateUntil) {
          toast({
            title: 'Error',
            description: 'Please specify an end date for recurring availability',
            variant: 'destructive'
          })
          setIsLoading(false)
          return
        }
        
        const generateUntilDate = new Date(formData.generateUntil)
        if (generateUntilDate <= startDateTime) {
          toast({
            title: 'Error',
            description: 'Generate until date must be after the start date',
            variant: 'destructive'
          })
          setIsLoading(false)
          return
        }
      }
      
      const payload = {
        id: selectedEntry?.id,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        status: formData.status,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined,
        recurringDays: formData.isRecurring ? formData.recurringDays : undefined,
        notes: formData.notes || undefined,
        generateUntil: formData.isRecurring && formData.generateUntil ? 
          new Date(formData.generateUntil).toISOString() : undefined
      }
      
      const response = await fetch('/api/talent/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: selectedEntry ? 'Availability updated successfully' : 'Availability created successfully'
        })
        setIsDialogOpen(false)
        resetForm()
        fetchAvailability()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to save availability',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to save availability',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (entryId: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/talent/availability/${entryId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Availability entry deleted successfully'
        })
        fetchAvailability()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete availability',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete availability',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '17:00',
      status: 'AVAILABLE',
      isRecurring: false,
      recurringPattern: 'weekly',
      recurringDays: [],
      notes: '',
      generateUntil: ''
    })
    setSelectedEntry(null)
  }

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    const entry = event.resource
    setSelectedEntry(entry)
    setFormData({
      startDate: format(entry.startDate, 'yyyy-MM-dd'),
      startTime: format(entry.startDate, 'HH:mm'),
      endDate: format(entry.endDate, 'yyyy-MM-dd'),
      endTime: format(entry.endDate, 'HH:mm'),
      status: entry.status as 'AVAILABLE' | 'UNAVAILABLE' | 'BUSY',
      isRecurring: entry.isRecurring,
      recurringPattern: (entry.recurringPattern as 'weekly' | 'biweekly' | 'monthly') || 'weekly',
      recurringDays: entry.recurringDays || [],
      notes: entry.notes || '',
      generateUntil: ''
    })
    setIsDialogOpen(true)
  }

  // Handle slot selection (creating new entry)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    resetForm()
    setFormData(prev => ({
      ...prev,
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm')
    }))
    setIsDialogOpen(true)
  }

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const entry = event.resource
    return (
      <div className={`p-1 rounded text-xs ${statusColors[entry.status]}`}>
        <div className="font-medium">{event.title}</div>
        {entry.isRecurring && <div className="text-xs opacity-75">Recurring</div>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Availability Calendar</h2>
          <p className="text-muted-foreground">
            Manage your availability to prevent booking conflicts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedEntry ? 'Edit Availability' : 'Add Availability'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: AvailabilityStatus) => 
                  setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AvailabilityStatus.AVAILABLE}>Available</SelectItem>
                    <SelectItem value={AvailabilityStatus.UNAVAILABLE}>Unavailable</SelectItem>
                    <SelectItem value={AvailabilityStatus.BUSY}>Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isRecurring: checked as boolean }))}
                />
                <Label htmlFor="isRecurring">Recurring availability</Label>
              </div>

              {formData.isRecurring && (
                <>
                  <div>
                    <Label>Recurring Days</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {dayNames.map((day, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${index}`}
                            checked={formData.recurringDays.includes(index)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  recurringDays: [...prev.recurringDays, index]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  recurringDays: prev.recurringDays.filter(d => d !== index)
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={`day-${index}`} className="text-sm">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="generateUntil">Generate Until</Label>
                    <input
                      id="generateUntil"
                      type="date"
                      value={formData.generateUntil}
                      onChange={(e) => setFormData(prev => ({ ...prev, generateUntil: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <div>
                  {selectedEntry && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete(selectedEntry.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : selectedEntry ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${statusColors[status as AvailabilityStatus]}`} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              views={['month', 'week', 'day']}
              defaultView="month"
              date={currentDate}
              onNavigate={setCurrentDate}
              components={{
                event: EventComponent
              }}
              eventPropGetter={(event) => ({
                className: statusColors[event.resource.status]
              })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
