-- AlterTable
ALTER TABLE "File" ADD COLUMN     "thumb_url" TEXT,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'public';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'public';
