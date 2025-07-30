-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_video_id_fkey";

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "file_id" INTEGER,
ALTER COLUMN "video_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
