/*
  Warnings:

  - You are about to drop the `Metadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_file_id_fkey";

-- DropTable
DROP TABLE "Metadata";
