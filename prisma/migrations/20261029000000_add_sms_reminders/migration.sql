-- SMS reminders: phone + carrier on the user, and an audit log for sends.
--
-- Additive only: the new columns are nullable/defaulted, and the new table is
-- not referenced by any existing row, so deploying this migration before the
-- application code is safe.

-- AlterTable
ALTER TABLE "user"
ADD COLUMN "phoneNumber" TEXT,
ADD COLUMN "phoneCarrier" TEXT,
ADD COLUMN "smsReminders" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "sms_notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_notification_userId_type_sentAt_idx" ON "sms_notification"("userId", "type", "sentAt");

-- CreateIndex
CREATE INDEX "sms_notification_taskId_idx" ON "sms_notification"("taskId");

-- CreateIndex
CREATE INDEX "sms_notification_scheduledFor_idx" ON "sms_notification"("scheduledFor");

-- AddForeignKey
ALTER TABLE "sms_notification" ADD CONSTRAINT "sms_notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_notification" ADD CONSTRAINT "sms_notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SMS reminders ship with every tier. The seed only upserts new plans, so
-- existing rows need the flag backfilled.
UPDATE "subscription_plan"
SET "features" = "features" || '{"smsNotifications": true}'::jsonb
WHERE "name" IN ('FREE', 'PRO');
