import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

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
      .screenshots({ count: 1, folder: path.dirname(thumbnailPath), filename: path.basename(thumbnailPath), size: '320x?' })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
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