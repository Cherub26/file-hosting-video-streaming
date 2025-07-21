import path from 'path';
import { PrismaClient } from '@prisma/client';
import { BlobServiceClient } from '@azure/storage-blob';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Request, Response } from 'express';
import { compressVideo, generateThumbnail, extractVideoMetadata } from '../services/videoService';

const prisma = new PrismaClient();
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING || '';
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || '';
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

// Helper to convert BigInt to string recursively
function convertBigIntToString(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (typeof obj[key] === 'bigint') {
        newObj[key] = obj[key].toString();
      } else if (typeof obj[key] === 'object') {
        newObj[key] = convertBigIntToString(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
  return obj;
}

export async function handleUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const file = req.file;
  const user = (req as any).user;
  const visibility = req.body.visibility === 'public' ? 'public' : 'private';
  let blobRecord;
  try {
    // Insert into blobs table (status: uploading)
    blobRecord = await prisma.blob.create({
      data: {
        user_id: user.id,
        temp_path: file.path,
        status: 'uploading',
      },
    });

    // Use original filename with a unique prefix for Azure blob name
    const uniquePrefix = Date.now() + '-' + user.id + '-';
    let azureBlobName = uniquePrefix + file.originalname;
    let thumbBlobName: string | null = null;
    let azureUrl = '';
    let thumbUrl: string | null = null;

    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      // 1. Compress/transcode video with FFmpeg (output as .mp4)
      const compressedPath = file.path + '-compressed.mp4';
      await compressVideo(file.path, compressedPath);

      // 2. Generate thumbnail (first frame)
      const thumbnailPath = file.path + '-thumb.jpg';
      await generateThumbnail(compressedPath, thumbnailPath);

      // 2.5. Extract and store video metadata
      const videoMetadata = await extractVideoMetadata(compressedPath);

      // 3. Upload compressed video to Azure with original filename
      azureBlobName = uniquePrefix + file.originalname.replace(/\.[^/.]+$/, '.mp4');
      const videoBlockBlobClient = containerClient.getBlockBlobClient(azureBlobName);
      await videoBlockBlobClient.uploadFile(compressedPath);
      azureUrl = videoBlockBlobClient.url;

      // 4. Upload thumbnail to Azure
      thumbBlobName = uniquePrefix + file.originalname.replace(/\.[^/.]+$/, '.jpg');
      const thumbBlockBlobClient = containerClient.getBlockBlobClient(thumbBlobName);
      await thumbBlockBlobClient.uploadFile(thumbnailPath);
      thumbUrl = thumbBlockBlobClient.url;

      // 5. Clean up local temp files
      fs.unlinkSync(file.path);
      fs.unlinkSync(compressedPath);
      fs.unlinkSync(thumbnailPath);

      // Insert into files table
      const fileRecord = await prisma.file.create({
        data: {
          owner_id: user.id,
          original_name: file.originalname,
          blob_name: azureBlobName,
          type: file.mimetype,
          size: BigInt(file.size),
          status: 'ready',
          azure_url: azureUrl,
          visibility,
        },
      });

      // Store metadata
      const metaEntries = Object.entries(videoMetadata).map(([key, value]) => ({
        video_id: fileRecord.id,
        key,
        value: value?.toString() || null,
      }));
      if (metaEntries.length > 0) {
        await prisma.metadata.createMany({ data: metaEntries });
      }

      // Update blobs table (status: ready)
      await prisma.blob.update({ where: { id: blobRecord.id }, data: { status: 'ready' } });

      res.json({
        file: convertBigIntToString(fileRecord),
        thumbnail: thumbBlobName,
        azureUrl,
        thumbUrl,
      });
      return;
    } else {
      // Non-video file: upload directly to Azure with original filename
      const fileBlockBlobClient = containerClient.getBlockBlobClient(azureBlobName);
      await fileBlockBlobClient.uploadFile(file.path);
      azureUrl = fileBlockBlobClient.url;
      // Clean up local temp file
      fs.unlinkSync(file.path);

      // Insert into files table
      const fileRecord = await prisma.file.create({
        data: {
          owner_id: user.id,
          original_name: file.originalname,
          blob_name: azureBlobName,
          type: file.mimetype,
          size: BigInt(file.size),
          status: 'ready',
          azure_url: azureUrl,
          visibility,
        },
      });

      // Update blobs table (status: ready)
      await prisma.blob.update({ where: { id: blobRecord.id }, data: { status: 'ready' } });

      res.json({
        file: convertBigIntToString(fileRecord),
        thumbnail: null,
        azureUrl,
        thumbUrl: null,
      });
      return;
    }
  } catch (err) {
    if (blobRecord) {
      await prisma.blob.update({ where: { id: blobRecord.id }, data: { status: 'failed' } });
    }
    const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err);
    res.status(500).json({ error: 'Upload or processing failed', details: errorMsg });
  }
}

export async function getVideoMetadata(req: Request, res: Response) {
  const { blobName, videoId } = req.query;
  try {
    let video_id = videoId;
    if (!video_id && blobName) {
      // Find video id by blob name
      const file = await prisma.file.findFirst({ where: { blob_name: String(blobName) } });
      if (!file) {
        return res.status(404).json({ error: 'Video not found' });
      }
      video_id = String(file.id);
    }
    if (!video_id) {
      return res.status(400).json({ error: 'Missing videoId or blobName' });
    }
    const metaResult = await prisma.metadata.findMany({ where: { video_id: Number(video_id) }, select: { key: true, value: true } });
    res.json({ metadata: metaResult });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metadata', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
} 