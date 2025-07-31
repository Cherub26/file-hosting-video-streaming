import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { compressImage, generateImageThumbnail } from './imageService';

export async function compressVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .outputOptions(['-preset', 'veryfast', '-crf', '28'])
      .toFormat('mp4')
      .on('start', (commandLine) => {
        console.log('Spawned ffmpeg with command:', commandLine);
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

export async function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({ 
        count: 1, 
        folder: path.dirname(thumbnailPath), 
        filename: path.basename(thumbnailPath), 
        size: '1280x?' // Preserve aspect ratio by using '?' for height
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

export async function generateCompressedThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
  // First generate the thumbnail using FFmpeg
  const tempThumbnailPath = thumbnailPath + '-temp.jpg';
  await generateThumbnail(videoPath, tempThumbnailPath);
  
  // Then resize and compress it using Sharp for better quality and smaller size
  // Use a larger max dimension to accommodate both landscape and portrait videos
  await generateImageThumbnail(tempThumbnailPath, thumbnailPath, 800); // Larger max dimension
  
  // Clean up temp file
  const fs = require('fs');
  if (fs.existsSync(tempThumbnailPath)) {
    fs.unlinkSync(tempThumbnailPath);
  }
}

export async function extractVideoMetadata(filePath: string): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      // Extract relevant fields
      const format = metadata.format || {};
      const streams = metadata.streams || [];
      const videoStream = streams.find((s: any) => s.codec_type === 'video');
      resolve({
        duration: format.duration,
        size: format.size,
        formatName: format.format_name,
        codec: videoStream ? videoStream.codec_name : undefined,
        width: videoStream ? videoStream.width : undefined,
        height: videoStream ? videoStream.height : undefined,
        bitRate: format.bit_rate,
        frameRate: videoStream ? videoStream.r_frame_rate : undefined
      });
    });
  });
} 