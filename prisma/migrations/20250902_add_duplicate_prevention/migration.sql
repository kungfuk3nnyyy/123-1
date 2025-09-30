
-- Add case-insensitive email index and constraints for duplicate prevention
-- This migration adds comprehensive duplicate prevention measures

-- Add case-insensitive unique index on email
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "User_email_ci_unique" ON "User" (LOWER("email"));

-- Add case-insensitive unique index on referral code (if not already present)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "User_referralCode_ci_unique" ON "User" (LOWER("referralCode")) WHERE "referralCode" IS NOT NULL;

-- Add case-insensitive unique index on talent username
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "TalentProfile_username_ci_unique" ON "TalentProfile" (LOWER("username")) WHERE "username" IS NOT NULL;

-- Add normalized email column for faster lookups (computed column)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNormalized" TEXT GENERATED ALWAYS AS (LOWER(TRIM("email"))) STORED;

-- Add phone number normalization for organizer profiles
ALTER TABLE "OrganizerProfile" ADD COLUMN IF NOT EXISTS "phoneNormalized" TEXT GENERATED ALWAYS AS (REGEXP_REPLACE(COALESCE("phoneNumber", ''), '[^0-9+]', '', 'g')) STORED;

-- Add phone number normalization for talent profiles  
ALTER TABLE "TalentProfile" ADD COLUMN IF NOT EXISTS "phoneNormalized" TEXT GENERATED ALWAYS AS (REGEXP_REPLACE(COALESCE("phoneNumber", ''), '[^0-9+]', '', 'g')) STORED;

-- Add unique constraint on normalized phone numbers (allowing nulls)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "OrganizerProfile_phone_unique" ON "OrganizerProfile" ("phoneNormalized") WHERE "phoneNormalized" IS NOT NULL AND "phoneNormalized" != '';

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "TalentProfile_phone_unique" ON "TalentProfile" ("phoneNormalized") WHERE "phoneNormalized" IS NOT NULL AND "phoneNormalized" != '';

-- Add duplicate detection tracking table
CREATE TABLE IF NOT EXISTS "DuplicateDetectionLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "detectionType" TEXT NOT NULL, -- 'REGISTRATION_ATTEMPT', 'EXISTING_SCAN', 'MANUAL_CHECK'
    "potentialDuplicateUserId" TEXT,
    "originalUserId" TEXT,
    "similarityScore" DECIMAL(3,2), -- 0.00 to 1.00
    "detectionReason" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionAction" TEXT, -- 'MERGED', 'IGNORED', 'BLOCKED', 'MANUAL_REVIEW'
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for duplicate detection log
CREATE INDEX IF NOT EXISTS "DuplicateDetectionLog_email_idx" ON "DuplicateDetectionLog" ("emailNormalized");
CREATE INDEX IF NOT EXISTS "DuplicateDetectionLog_resolved_idx" ON "DuplicateDetectionLog" ("resolved");
CREATE INDEX IF NOT EXISTS "DuplicateDetectionLog_createdAt_idx" ON "DuplicateDetectionLog" ("createdAt");
CREATE INDEX IF NOT EXISTS "DuplicateDetectionLog_detectionType_idx" ON "DuplicateDetectionLog" ("detectionType");

-- Add account merge tracking table
CREATE TABLE IF NOT EXISTS "AccountMerge" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "primaryUserId" TEXT NOT NULL,
    "mergedUserId" TEXT NOT NULL,
    "mergeReason" TEXT NOT NULL,
    "mergedData" JSONB NOT NULL, -- Store what data was merged
    "mergedByAdminId" TEXT,
    "mergedByUserId" TEXT, -- If user initiated the merge
    "mergeType" TEXT NOT NULL, -- 'ADMIN_INITIATED', 'USER_INITIATED', 'AUTOMATIC'
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("primaryUserId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("mergedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Add indexes for account merge tracking
CREATE INDEX IF NOT EXISTS "AccountMerge_primaryUserId_idx" ON "AccountMerge" ("primaryUserId");
CREATE INDEX IF NOT EXISTS "AccountMerge_mergedUserId_idx" ON "AccountMerge" ("mergedUserId");
CREATE INDEX IF NOT EXISTS "AccountMerge_createdAt_idx" ON "AccountMerge" ("createdAt");

-- Add registration attempt tracking for suspicious activity
CREATE TABLE IF NOT EXISTS "RegistrationAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "duplicateDetected" BOOLEAN NOT NULL DEFAULT false,
    "duplicateUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for registration attempt tracking
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_email_idx" ON "RegistrationAttempt" ("emailNormalized");
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_ipAddress_idx" ON "RegistrationAttempt" ("ipAddress");
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_createdAt_idx" ON "RegistrationAttempt" ("createdAt");
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_duplicateDetected_idx" ON "RegistrationAttempt" ("duplicateDetected");
