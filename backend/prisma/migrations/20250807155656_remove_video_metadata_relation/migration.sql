/*
  Warnings:

  - You are about to drop the column `video_id` on the `Metadata` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_video_id_fkey";

-- AlterTable
ALTER TABLE "Metadata" DROP COLUMN "video_id";
