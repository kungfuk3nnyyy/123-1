# Real-Time Availability/Calendar System

## Overview

The Real-Time Availability/Calendar System is a comprehensive solution designed to prevent booking conflicts and delays by allowing talents to manage their availability and enabling organizers to check availability before making booking requests.

## Features

### For Talents
- **Calendar Management**: Interactive calendar interface for managing availability
- **Flexible Scheduling**: Mark dates as Available, Unavailable, or Busy
- **Recurring Availability**: Set recurring patterns (weekly, monthly) with specific days
- **Bulk Operations**: Select multiple dates and apply availability status
- **Notes Support**: Add optional notes to availability entries
- **Real-time Updates**: Changes are immediately reflected in the booking system

### For Organizers
- **Availability Checking**: Real-time availability verification before booking
- **Conflict Prevention**: System prevents booking requests for unavailable dates
- **Clear Feedback**: Visual indicators showing talent availability status
- **Booking Validation**: Automatic validation during booking creation process

## System Architecture

### Database Schema

#### TalentAvailability Model
```prisma
model TalentAvailability {
  id               String             @id @default(cuid())
  talentId         String
  startDate        DateTime
  endDate          DateTime
  status           AvailabilityStatus @default(AVAILABLE)
  isRecurring      Boolean            @default(false)
  recurringPattern String?            // e.g., "weekly", "monthly"
  recurringDays    Int[]              // Days of week (0-6, Sunday=0)
  notes            String?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  
  User             User               @relation(fields: [talentId], references: [id], onDelete: Cascade)
  
  @@index([talentId])
  @@index([startDate, endDate])
  @@index([status])
}
```

#### AvailabilityStatus Enum
```prisma
enum AvailabilityStatus {
  AVAILABLE    // Open for bookings
  UNAVAILABLE  // Not available for bookings
  BUSY         // Tentatively booked or busy
}
```

### API Endpoints

#### Talent Availability Management
- `GET /api/talent/availability` - Fetch availability entries
- `POST /api/talent/availability` - Create/update availability
- `DELETE /api/talent/availability/[id]` - Delete availability entry

#### Availability Checking
- `POST /api/availability/check` - Check talent availability for booking

### Core Functions

#### `checkTalentAvailability(talentId, startDate, endDate)`
Checks if a talent is available for a specific date range, considering:
- Existing availability entries (UNAVAILABLE/BUSY status)
- Existing bookings (ACCEPTED/IN_PROGRESS/PENDING status)
- Date range overlaps

Returns:
```typescript
{
  isAvailable: boolean
  conflictingEntries: AvailabilityEntry[]
  message: string
}
```

#### `getTalentAvailability(talentId, startDate, endDate)`
Retrieves all availability entries for a talent within a date range.

#### `upsertAvailability(talentId, data)`
Creates or updates availability entries with support for:
- Single date entries
- Recurring patterns
- Bulk operations

#### `generateRecurringAvailability(talentId, baseEntry, generateUntil)`
Generates recurring availability entries based on patterns and specific days.

## User Interface Components

### TalentCalendar Component
- Interactive calendar using `react-big-calendar`
- Click-to-create availability entries
- Visual status indicators with color coding
- Edit/delete existing entries
- Recurring availability setup

### AvailabilityChecker Component
- Real-time availability checking for organizers
- Visual feedback on availability status
- Conflict display with detailed information
- Integration with booking forms

### AvailabilityLegend Component
- Status legend with color coding
- Usage instructions
- Compact and full display modes

## Integration Points

### Booking System Integration
The availability system is integrated into the booking creation process:

1. **Pre-booking Check**: Before creating a booking, the system checks talent availability
2. **Conflict Prevention**: Booking requests are rejected if conflicts exist
3. **Real-time Validation**: Availability is checked in real-time during booking creation
4. **Error Handling**: Clear error messages when bookings conflict with availability

### Dashboard Integration
- Added "Availability" link to talent dashboard sidebar
- Dedicated availability management page at `/talent/availability`
- Seamless integration with existing dashboard layout

## Usage Examples

### Setting Up Availability (Talent)
1. Navigate to Dashboard → Availability
2. Click on calendar dates or use "Add Availability" button
3. Set date range, status, and optional notes
4. For recurring availability:
   - Enable "Recurring availability"
   - Select days of the week
   - Set end date for generation
5. Save the availability entry

### Checking Availability (Organizer)
1. When creating a booking, select talent and date
2. System automatically checks availability
3. If conflicts exist, booking is prevented with clear error message
4. Organizer can see conflicting periods and choose alternative dates

### Managing Recurring Availability
```typescript
// Example: Set weekly availability Monday-Friday, 9 AM - 5 PM
const recurringData = {
  startDate: new Date('2025-09-15T09:00:00Z'),
  endDate: new Date('2025-09-15T17:00:00Z'),
  status: AvailabilityStatus.AVAILABLE,
  isRecurring: true,
  recurringPattern: 'weekly',
  recurringDays: [1, 2, 3, 4, 5], // Monday to Friday
  notes: 'Regular business hours'
}
```

## API Usage Examples

### Check Availability
```javascript
const response = await fetch('/api/availability/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    talentId: 'talent-id',
    startDate: '2025-09-15T09:00:00Z',
    endDate: '2025-09-15T17:00:00Z'
  })
})

const { data } = await response.json()
console.log(data.isAvailable) // true/false
console.log(data.conflictingEntries) // Array of conflicts
```

### Create Availability
```javascript
const response = await fetch('/api/talent/availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: '2025-09-15T09:00:00Z',
    endDate: '2025-09-15T17:00:00Z',
    status: 'AVAILABLE',
    notes: 'Available for bookings'
  })
})
```

## Testing

The system includes comprehensive tests covering:
- Availability checking logic
- CRUD operations for availability entries
- Recurring availability generation
- Integration with booking system
- Edge cases and error handling

Run tests with:
```bash
npm test
npm run test:coverage
```

## Performance Considerations

### Database Optimization
- Indexed fields: `talentId`, `startDate`, `endDate`, `status`
- Efficient date range queries using overlapping conditions
- Bulk operations for recurring availability

### Caching Strategy
- Client-side caching of availability data
- Optimistic updates for better user experience
- Automatic refresh on data changes

### Scalability
- Pagination for large availability datasets
- Efficient date range queries
- Background processing for recurring generation

## Security

### Access Control
- Talents can only manage their own availability
- Organizers can only check availability, not modify
- Admin users have full access for support purposes

### Data Validation
- Server-side validation of all inputs
- Date range validation
- Status enum validation
- SQL injection prevention through Prisma ORM

## Migration

To deploy the availability system:

1. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Update Dependencies**:
   ```bash
   npm install react-big-calendar date-fns
   ```

3. **Environment Setup**:
   - No additional environment variables required
   - Uses existing database connection

## Troubleshooting

### Common Issues

1. **Calendar Not Loading**:
   - Check if `react-big-calendar` CSS is imported
   - Verify date format consistency

2. **Availability Check Failing**:
   - Ensure proper date serialization
   - Check API endpoint accessibility
   - Verify user authentication

3. **Recurring Availability Not Generating**:
   - Check `recurringDays` array format
   - Verify `generateUntil` date is in the future
   - Ensure proper date calculations

### Debug Mode
Enable debug logging by setting:
```javascript
console.log('Availability check:', availabilityResult)
```

## Future Enhancements

### Planned Features
- **Time Zone Support**: Handle different time zones for global talents
- **Availability Templates**: Pre-defined availability patterns
- **Bulk Import/Export**: CSV import/export for availability data
- **Integration Webhooks**: Real-time notifications for availability changes
- **Advanced Recurring Patterns**: Monthly, yearly, custom patterns
- **Availability Analytics**: Usage statistics and insights

### API Extensions
- GraphQL support for complex queries
- Webhook endpoints for real-time updates
- Bulk operations API for mass updates
- Availability forecasting based on historical data

## Support

For technical support or questions about the availability system:
1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Consult the API documentation
4. Contact the development team

## Changelog

### Version 1.0.0 (Initial Release)
- Basic availability management for talents
- Real-time availability checking for organizers
- Calendar interface with visual indicators
- Recurring availability support
- Integration with booking system
- Comprehensive test coverage
- API endpoints for all operations
- Dashboard integration
- Migration scripts and documentation
