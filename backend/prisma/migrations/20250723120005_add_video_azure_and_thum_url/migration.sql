/*
  Warnings:

  - You are about to drop the column `file_path` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "file_path",
ADD COLUMN     "azure_url" TEXT,
ADD COLUMN     "thumb_url" TEXT;
