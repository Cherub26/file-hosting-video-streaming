-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "bit_rate" TEXT,
ADD COLUMN     "codec" TEXT,
ADD COLUMN     "duration" DOUBLE PRECISION,
ADD COLUMN     "format_name" TEXT,
ADD COLUMN     "frame_rate" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "width" INTEGER;
