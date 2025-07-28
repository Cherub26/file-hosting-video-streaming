/*
  Warnings:

  - You are about to drop the column `owner_id` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `Video` table. All the data in the column will be lost.
  - Added the required column `tenant_id` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_owner_id_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "owner_id",
ADD COLUMN     "tenant_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "owner_id",
ADD COLUMN     "tenant_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
