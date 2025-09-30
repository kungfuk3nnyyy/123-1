# 🚀 GigSecure Platform - Complete Setup Instructions

This guide will help you set up and run the GigSecure event talents platform locally with all the implemented features and improvements.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **PostgreSQL** (v13 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### Verify Installation
```bash
node --version    # Should show v18.0.0+
npm --version     # Should show 8.0.0+
psql --version    # Should show PostgreSQL 13+
```

## 🗄️ Database Setup

### 1. Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE gigsecure_dev;
CREATE USER gigsecure_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gigsecure_dev TO gigsecure_user;

# Exit PostgreSQL
\q
```

### 2. Set Database URL
The database URL format should be:
```
postgresql://gigsecure_user:your_secure_password@localhost:5432/gigsecure_dev
```

## ⚙️ Environment Configuration

### 1. Copy Environment File
```bash
# Copy the environment template
cp .envback .env
```

### 2. Update Environment Variables
Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://gigsecure_user:your_secure_password@localhost:5432/gigsecure_dev"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-make-it-long-and-random"

# Email Configuration (for development, you can use dummy values)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@gigsecure.com"

# File Upload (optional - for production)
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Payment Integration (optional - for production)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
```

## 📦 Installation

### 1. Install Dependencies
```bash
# Install all project dependencies
npm install

# If you encounter peer dependency issues, use:
npm install --legacy-peer-deps
```

### 2. Generate Prisma Client
```bash
# Generate the Prisma client
npx prisma generate
```

## 🗃️ Database Migration and Seeding

### 1. Apply Database Migrations
```bash
# Apply all database migrations
npx prisma migrate deploy

# Alternative: Push schema to database
npx prisma db push
```

### 2. Seed Test Users
```bash
# Create all test users with proper data
npx tsx scripts/seed-enhanced.ts
```

### 3. Verify Test Users
```bash
# Validate that all test users are working
npx tsx scripts/test-user-validator.ts
```

## 🚀 Running the Application

### 1. Start Development Server
```bash
# Start the Next.js development server
npm run dev
```

### 2. Access the Application
Open your browser and navigate to:
- **Main Application**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Talent Dashboard**: http://localhost:3000/talent
- **Organizer Dashboard**: http://localhost:3000/organizer

## 👥 Test User Accounts

Use these accounts to test different features:

### Admin Accounts
| Email | Password | Role | Status |
|-------|----------|------|--------|
| `john@doe.com` | `AdminPass123!` | Admin | Verified |
| `admin.test@example.com` | `TestPass123!` | Admin | Verified |

### Talent Accounts (Service Providers)
| Email | Password | Role | Status | Specialty |
|-------|----------|------|--------|-----------|
| `sarah.photographer@example.com` | `TalentPass123!` | Talent | Verified | Photography |
| `mike.dj@example.com` | `TalentPass123!` | Talent | Verified | DJ Services |
| `grace.catering@example.com` | `TalentPass123!` | Talent | Verified | Catering |
| `talent.unverified@example.com` | `TestPass123!` | Talent | Pending | General |

### Organizer Accounts (Event Planners)
| Email | Password | Role | Status | Company |
|-------|----------|------|--------|---------|
| `contact@eventpro.ke` | `OrganizerPass123!` | Organizer | Verified | EventPro Kenya |
| `info@weddingbliss.co.ke` | `OrganizerPass123!` | Organizer | Verified | Wedding Bliss |
| `organizer.test@example.com` | `TestPass123!` | Organizer | Pending | Test Company |

## 🧪 Testing Key Features

### 1. Authentication & Registration
- Visit `/auth/login` and `/auth/signup`
- Test the new frontend validation (instant feedback)
- Try registering with invalid data to see validation messages

### 2. Real-Time Availability System
- Log in as a talent user
- Navigate to `/talent/availability`
- Test the calendar interface for marking availability
- Try booking as an organizer to see availability checking

### 3. Unified Marketplace
- Visit `/marketplace`
- Toggle between "Hire Talent" and "Find Work" modes
- Test event posting and proposal submission

### 4. Empty States
- Log in with a new user account
- Visit dashboard pages to see consistent empty states
- Test search functionality to see "no results" states

### 5. Form Validation
- Try creating packages, events, or updating profiles
- Test real-time validation feedback
- Submit forms with invalid data to see error handling

### 6. Duplicate Prevention
- Try registering with existing email addresses
- Test case-insensitive email validation
- Access admin panel to see duplicate detection tools

## 🛠️ Development Tools

### Database Management
```bash
# View database in browser
npx prisma studio

# Reset database (careful - deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Useful Scripts
```bash
# Find duplicate users
npx tsx scripts/find-duplicates.ts

# Test login functionality
node scripts/test-login-functionality.js

# Monitor for duplicates
npx tsx scripts/monitor-duplicates.ts
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error
```
Error: Can't reach database server
```
**Solution:**
- Ensure PostgreSQL is running: `brew services start postgresql` (Mac) or `sudo service postgresql start` (Linux)
- Check DATABASE_URL in `.env` file
- Verify database exists and user has permissions

#### 2. Prisma Client Not Generated
```
Error: @prisma/client did not initialize yet
```
**Solution:**
```bash
npx prisma generate
npm run dev
```

#### 3. Migration Errors
```
Error: Migration failed to apply
```
**Solution:**
```bash
# Reset and reapply migrations
npx prisma migrate reset
npx prisma migrate deploy
npx tsx scripts/seed-enhanced.ts
```

#### 4. Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

#### 5. Environment Variables Not Loading
```
Error: Environment variable not found
```
**Solution:**
- Ensure `.env` file exists in project root
- Check file permissions: `chmod 644 .env`
- Restart development server

#### 6. Test Users Not Working
```
Error: Invalid credentials
```
**Solution:**
```bash
# Re-seed test users
npx tsx scripts/seed-enhanced.ts

# Validate users
npx tsx scripts/test-user-validator.ts
```

### Performance Issues
If the application is slow:
1. Check database indexes: `npx prisma studio`
2. Monitor console for errors
3. Ensure PostgreSQL is optimized for development

### Email Issues (Development)
For development, email features may not work without proper SMTP configuration. This won't affect core functionality.

## 📱 Mobile Testing

The application is responsive. Test on mobile by:
1. Opening browser developer tools (F12)
2. Clicking device toolbar icon
3. Selecting mobile device simulation

## 🔒 Security Notes

### Development vs Production
- Current setup is for **development only**
- For production, update all secrets and API keys
- Use proper SSL certificates
- Configure proper CORS settings
- Set up proper email service

### Test Data
- Test users have realistic but fake data
- Don't use test credentials in production
- Reset database before production deployment

## 📚 Additional Resources

### Documentation
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **React Hook Form**: https://react-hook-form.com
- **Zod Validation**: https://zod.dev

### Project Structure
```
gigsecure2-main/
├── app/                 # Next.js app directory
├── components/          # Reusable React components
├── lib/                # Utility functions and configurations
├── prisma/             # Database schema and migrations
├── scripts/            # Database and utility scripts
├── hooks/              # Custom React hooks
└── constants/          # Application constants
```

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Application loads at http://localhost:3000
- [ ] Can log in with test users
- [ ] Different dashboards load (admin, talent, organizer)
- [ ] Forms show real-time validation
- [ ] Calendar system works for talents
- [ ] Marketplace toggle functions
- [ ] Empty states display properly
- [ ] Database operations work (create, read, update)

## 🎉 Success!

If you've completed all steps successfully, you now have:

✅ **Fully functional GigSecure platform**
✅ **Real-time availability/calendar system**
✅ **Unified marketplace with job posting**
✅ **Comprehensive form validation**
✅ **Duplicate user prevention**
✅ **Consistent empty states**
✅ **Working test users for all roles**
✅ **Professional UI/UX improvements**

You're ready to explore and test all the implemented features!

---

## 🆘 Need Help?

If you encounter issues not covered in this guide:

1. Check the browser console for JavaScript errors
2. Check the terminal for server errors
3. Verify all environment variables are set correctly
4. Ensure database is running and accessible
5. Try restarting the development server

The application includes comprehensive error handling and logging to help identify issues quickly.
