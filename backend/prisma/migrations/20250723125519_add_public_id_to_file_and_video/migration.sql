/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[public_id]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "public_id" TEXT;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "public_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "File_public_id_key" ON "File"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "Video_public_id_key" ON "Video"("public_id");
