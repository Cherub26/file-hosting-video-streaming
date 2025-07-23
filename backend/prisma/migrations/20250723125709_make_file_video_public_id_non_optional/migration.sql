/*
  Warnings:

  - Made the column `public_id` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `public_id` on table `Video` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "File" ALTER COLUMN "public_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Video" ALTER COLUMN "public_id" SET NOT NULL;
