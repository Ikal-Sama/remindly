/*
  Warnings:

  - Made the column `description` on table `task` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dueDate` on table `task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "task" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "dueDate" SET NOT NULL;
