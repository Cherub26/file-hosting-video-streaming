import sharp from 'sharp';
import path from 'path';

export async function compressImage(inputPath: string, outputPath: string, quality: number = 80): Promise<void> {
  try {
    await sharp(inputPath)
      .jpeg({ quality })
      .toFile(outputPath);
  } catch (error) {
    throw new Error(`Failed to compress image: ${error}`);
  }
}

export async function generateImageThumbnail(inputPath: string, thumbnailPath: string, width: number = 640): Promise<void> {
  try {
    await sharp(inputPath)
      .resize(width, null, { 
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3 // Better quality resizing
      })
      .jpeg({ 
        quality: 90, // Higher quality
        progressive: true, // Progressive JPEG for better loading
        mozjpeg: true // Use mozjpeg for better compression
      })
      .toFile(thumbnailPath);
  } catch (error) {
    throw new Error(`Failed to generate image thumbnail: ${error}`);
  }
}

export async function extractImageMetadata(filePath: string): Promise<{ [key: string]: any }> {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasProfile: metadata.hasProfile,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    throw new Error(`Failed to extract image metadata: ${error}`);
  }
}

export async function isImageFile(mimetype: string): Promise<boolean> {
  return mimetype.startsWith('image/');
} 