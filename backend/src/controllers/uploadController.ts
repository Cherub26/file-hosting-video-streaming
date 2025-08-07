import path from 'path';
import { PrismaClient } from '@prisma/client';
import { BlobServiceClient } from '@azure/storage-blob';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Request, Response } from 'express';
import { compressVideo, generateCompressedThumbnail, extractVideoMetadata } from '../services/videoService';
import { compressImage, generateImageThumbnail, extractImageMetadata, isImageFile } from '../services/imageService';
import { Readable } from 'stream';
import { convertBigIntToString } from '../utils/helpers';

const prisma = new PrismaClient();
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING || '';
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || '';
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

export async function handleUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const file = req.file;
  const user = req.user;
  const visibility = req.body.visibility || 'public'; // Default to public if not specified
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

      // 2. Generate compressed thumbnail (first frame)
      const thumbnailPath = file.path + '-thumb.jpg';
      await generateCompressedThumbnail(compressedPath, thumbnailPath);

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

      // 5. Get compressed file size
      const compressedStats = fs.statSync(compressedPath);

      // 5.5 Insert into videos table
      const videoRecord = await prisma.video.create({
        data: {
          tenant_id: user.tenant_id,
          title: file.originalname,
          type: file.mimetype,
          azure_url: azureUrl,
          thumb_url: thumbUrl,
          size: BigInt(compressedStats.size),
          visibility: visibility,
          // created_at will default to now
        },
      });

      // 6. Store metadata
      const metaEntries = Object.entries(videoMetadata).map(([key, value]) => ({
        video_id: videoRecord.id,
        key,
        value: value?.toString() || null,
      }));
      if (metaEntries.length > 0) {
        await prisma.metadata.createMany({ data: metaEntries });
      }

      // 7. Clean up local temp files
      fs.unlinkSync(file.path);
      fs.unlinkSync(compressedPath);
      fs.unlinkSync(thumbnailPath);

      // Update blobs table (status: ready)
      await prisma.blob.update({ where: { id: blobRecord.id }, data: { status: 'ready' } });

      res.json({
        video: convertBigIntToString(videoRecord),
        thumbnail: thumbBlobName,
        azureUrl,
        thumbUrl,
      });
      return;
    } else if (await isImageFile(file.mimetype)) {
      // Handle image files with compression only (no thumbnails)
      // 1. Compress image with Sharp
      const compressedPath = file.path + '-compressed.jpg';
      await compressImage(file.path, compressedPath, 80);

      // 2. Extract and store image metadata
      const imageMetadata = await extractImageMetadata(compressedPath);

      // 3. Upload compressed image to Azure
      azureBlobName = uniquePrefix + file.originalname.replace(/\.[^/.]+$/, '.jpg');
      const imageBlockBlobClient = containerClient.getBlockBlobClient(azureBlobName);
      await imageBlockBlobClient.uploadFile(compressedPath);
      azureUrl = imageBlockBlobClient.url;

      // 4. Get compressed file size
      const compressedStats = fs.statSync(compressedPath);

      // 5. Insert into files table
      const fileRecord = await prisma.file.create({
        data: {
          tenant_id: user.tenant_id,
          original_name: file.originalname,
          blob_name: azureBlobName,
          type: file.mimetype,
          size: BigInt(compressedStats.size),
          visibility: visibility,
          azure_url: azureUrl,
        },
      });

      // 6. Store metadata for the image
      const metaEntries = Object.entries(imageMetadata).map(([key, value]) => ({
        file_id: fileRecord.id,
        key,
        value: value?.toString() || null,
      }));
      if (metaEntries.length > 0) {
        await prisma.metadata.createMany({ data: metaEntries });
      }

      // 7. Clean up local temp files
      fs.unlinkSync(file.path);
      fs.unlinkSync(compressedPath);

      // Update blobs table (status: ready)
      await prisma.blob.update({ where: { id: blobRecord.id }, data: { status: 'ready' } });

      res.json({
        file: convertBigIntToString(fileRecord),
        azureUrl,
      });
      return;
    } else {
      // Non-video/image file: upload directly to Azure with original filename
      const fileBlockBlobClient = containerClient.getBlockBlobClient(azureBlobName);
      await fileBlockBlobClient.uploadFile(file.path);
      azureUrl = fileBlockBlobClient.url;
      // Clean up local temp file
      fs.unlinkSync(file.path);

      // Insert into files table
      const fileRecord = await prisma.file.create({
        data: {
          tenant_id: user.tenant_id,
          original_name: file.originalname,
          blob_name: azureBlobName,
          type: file.mimetype,
          size: BigInt(file.size),
          visibility: visibility,
          azure_url: azureUrl,
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

 