-- AlterTable
ALTER TABLE "public"."Payout" DROP COLUMN IF EXISTS "transactionRef";

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."RegistrationAttempt" (
    "id" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "nameNormalized" TEXT,
    "phoneNormalized" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "duplicateDetected" BOOLEAN NOT NULL DEFAULT false,
    "duplicateUserId" TEXT,
    "failureReason" TEXT,
    "role" "public"."UserRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_emailNormalized_idx" ON "public"."RegistrationAttempt"("emailNormalized");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_ipAddress_idx" ON "public"."RegistrationAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_createdAt_idx" ON "public"."RegistrationAttempt"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_success_idx" ON "public"."RegistrationAttempt"("success");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RegistrationAttempt_duplicateDetected_idx" ON "public"."RegistrationAttempt"("duplicateDetected");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_organizerId_idx" ON "public"."Booking"("organizerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_talentId_idx" ON "public"."Booking"("talentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "public"."Booking"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_eventId_idx" ON "public"."Booking"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" ON "public"."Booking"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_talentId_status_idx" ON "public"."Booking"("talentId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_organizerId_status_idx" ON "public"."Booking"("organizerId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_proposedDate_idx" ON "public"."Booking"("proposedDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_acceptedDate_idx" ON "public"."Booking"("acceptedDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_completedDate_idx" ON "public"."Booking"("completedDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_talentId_idx" ON "public"."Package"("talentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_category_idx" ON "public"."Package"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_location_idx" ON "public"."Package"("location");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_price_idx" ON "public"."Package"("price");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_isPublished_idx" ON "public"."Package"("isPublished");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_isActive_idx" ON "public"."Package"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_isPublished_isActive_idx" ON "public"."Package"("isPublished", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_category_isPublished_isActive_idx" ON "public"."Package"("category", "isPublished", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_bookingCount_idx" ON "public"."Package"("bookingCount");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Package_createdAt_idx" ON "public"."Package"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TalentProfile_category_idx" ON "public"."TalentProfile"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TalentProfile_location_idx" ON "public"."TalentProfile"("location");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TalentProfile_hourlyRate_idx" ON "public"."TalentProfile"("hourlyRate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TalentProfile_averageRating_idx" ON "public"."TalentProfile"("averageRating");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TalentProfile_totalBookings_idx" ON "public"."TalentProfile"("totalBookings");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TalentProfile_category_location_idx" ON "public"."TalentProfile"("category", "location");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TalentProfile_averageRating_totalReviews_idx" ON "public"."TalentProfile"("averageRating", "totalReviews");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_adminApprovalStatus_idx" ON "public"."User"("adminApprovalStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_adminApprovalStatus_idx" ON "public"."User"("role", "adminApprovalStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_isActive_role_idx" ON "public"."User"("isActive", "role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "public"."User"("emailVerificationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_referralCode_idx" ON "public"."User"("referralCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "public"."User"("createdAt");
