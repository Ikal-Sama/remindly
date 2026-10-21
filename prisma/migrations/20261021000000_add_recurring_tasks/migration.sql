-- AlterTable
ALTER TABLE "task" ADD COLUMN "recurrenceFrequency" TEXT;
ALTER TABLE "task" ADD COLUMN "recurrenceInterval" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "task" ADD COLUMN "recurrenceEndDate" TIMESTAMP(3);
