
# 🧪 Test Users Guide

This document provides comprehensive information about test users in the Event Talents platform for development and testing purposes.

## 📋 Test User Accounts

### 👑 Admin Accounts

#### Primary Admin
- **Email:** `john@doe.com`
- **Password:** `AdminPass123!`
- **Role:** ADMIN
- **Status:** APPROVED
- **Purpose:** Primary admin account for testing administrative functions

#### Secondary Admin
- **Email:** `admin.test@example.com`
- **Password:** `TestPass123!`
- **Role:** ADMIN
- **Status:** APPROVED
- **Purpose:** Secondary admin for testing admin workflows and approvals

### 🎭 Talent Accounts

#### Verified Photographer
- **Email:** `sarah.photographer@example.com`
- **Password:** `TalentPass123!`
- **Role:** TALENT
- **Category:** Photography
- **Status:** APPROVED & VERIFIED
- **Features:** Complete profile, packages, high ratings
- **Purpose:** Testing talent dashboard, booking acceptance, package management

#### Verified DJ
- **Email:** `mike.dj@example.com`
- **Password:** `TalentPass123!`
- **Role:** TALENT
- **Category:** DJ/Music
- **Status:** APPROVED & VERIFIED
- **Features:** Complete profile, packages, good ratings
- **Purpose:** Testing entertainment category workflows

#### Verified Caterer
- **Email:** `grace.catering@example.com`
- **Password:** `TalentPass123!`
- **Role:** TALENT
- **Category:** Catering
- **Status:** APPROVED & VERIFIED
- **Features:** Complete profile, packages, excellent ratings
- **Purpose:** Testing catering services workflows

#### Unverified Talent
- **Email:** `talent.unverified@example.com`
- **Password:** `TestPass123!`
- **Role:** TALENT
- **Status:** PENDING APPROVAL
- **Purpose:** Testing admin approval workflows and unverified user restrictions

### 🏢 Organizer Accounts

#### EventPro Kenya
- **Email:** `contact@eventpro.ke`
- **Password:** `OrganizerPass123!`
- **Role:** ORGANIZER
- **Company:** EventPro Kenya Limited
- **Status:** APPROVED & VERIFIED
- **Features:** Complete profile, event history
- **Purpose:** Testing event creation, talent booking, payment flows

#### Wedding Bliss Events
- **Email:** `info@weddingbliss.co.ke`
- **Password:** `OrganizerPass123!`
- **Role:** ORGANIZER
- **Company:** Wedding Bliss Events Ltd
- **Status:** APPROVED & VERIFIED
- **Features:** Wedding-focused profile, high ratings
- **Purpose:** Testing wedding-specific workflows

#### Test Organizer
- **Email:** `organizer.test@example.com`
- **Password:** `TestPass123!`
- **Role:** ORGANIZER
- **Status:** PENDING APPROVAL
- **Purpose:** Testing organizer approval workflows

## 🔐 Password Requirements

All test user passwords meet the current validation requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

## 🛠️ Setup and Management

### Running the Seed Script

To create all test users with proper data:

```bash
# Enhanced seed with comprehensive test users
npx tsx scripts/seed-enhanced.ts

# Or use the original seed (basic test users)
npx tsx scripts/seed.ts
```

### Updating Existing Users

To update existing test users to meet current requirements:

```bash
npx tsx scripts/update-existing-users.ts
```

### Validating Test Users

To check if all test users are working correctly:

```bash
npx tsx scripts/test-user-validator.ts
```

## 🧪 Testing Scenarios

### Authentication Testing
- ✅ Login with all user types
- ✅ Role-based dashboard access
- ✅ Admin approval status checks
- ✅ Email verification requirements

### Role-Based Access Control
- ✅ Admin: Full platform access
- ✅ Talent: Profile management, booking acceptance
- ✅ Organizer: Event creation, talent discovery
- ✅ Unverified users: Limited access

### User Workflows
- ✅ Profile completion
- ✅ Package creation (talents)
- ✅ Event creation (organizers)
- ✅ Booking flows
- ✅ Messaging system
- ✅ Payment processing
- ✅ Review system

### Admin Functions
- ✅ User approval/rejection
- ✅ Platform analytics
- ✅ Dispute resolution
- ✅ Payout management

## 📊 Test Data

### Packages
Each verified talent has 2 sample packages:
- Photography: Wedding and Corporate packages
- DJ/Music: Wedding and Corporate entertainment
- Catering: Wedding feast and Corporate buffet

### Profiles
All verified users have complete profiles with:
- Bio and tagline
- Contact information
- Skills and experience
- Ratings and reviews
- Location and availability

### Notification Preferences
All users have notification preferences configured for:
- Email notifications
- Booking alerts
- Payment confirmations
- Review notifications
- Admin updates

## 🔧 Troubleshooting

### Common Issues

1. **Login Failed**
   - Check password meets validation requirements
   - Verify email is marked as verified
   - Ensure admin approval status is correct

2. **Missing Profile Data**
   - Run the enhanced seed script
   - Check database relationships
   - Verify profile creation in seed data

3. **Permission Errors**
   - Verify user role assignment
   - Check admin approval status
   - Ensure email verification is complete

### Quick Fixes

```bash
# Reset all test users
npx tsx scripts/seed-enhanced.ts

# Update passwords only
npx tsx scripts/update-existing-users.ts

# Validate current state
npx tsx scripts/test-user-validator.ts
```

## 📝 Development Notes

- All test users have verified emails to bypass email verification in testing
- Admin users are pre-approved to allow immediate access
- Talent profiles include realistic data for comprehensive testing
- Organizer profiles represent different business types
- Passwords are securely hashed with bcrypt (12 rounds)
- Referral codes are automatically generated for all users

## 🚀 Quick Start

1. Run the enhanced seed script:
   ```bash
   npx tsx scripts/seed-enhanced.ts
   ```

2. Validate all users are working:
   ```bash
   npx tsx scripts/test-user-validator.ts
   ```

3. Start testing with any of the provided credentials!

---

**Last Updated:** September 2, 2025  
**Version:** 2.0 - Enhanced Test Users
