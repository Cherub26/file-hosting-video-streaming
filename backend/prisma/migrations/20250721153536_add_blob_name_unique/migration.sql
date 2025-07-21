/*
  Warnings:

  - A unique constraint covering the columns `[blob_name]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_blob_name_key" ON "File"("blob_name");
