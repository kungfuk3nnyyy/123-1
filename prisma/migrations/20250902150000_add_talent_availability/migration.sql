
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'BUSY');

-- CreateTable
CREATE TABLE "TalentAvailability" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "recurringDays" INTEGER[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalentAvailability_talentId_idx" ON "TalentAvailability"("talentId");

-- CreateIndex
CREATE INDEX "TalentAvailability_startDate_endDate_idx" ON "TalentAvailability"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "TalentAvailability_status_idx" ON "TalentAvailability"("status");

-- AddForeignKey
ALTER TABLE "TalentAvailability" ADD CONSTRAINT "TalentAvailability_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
