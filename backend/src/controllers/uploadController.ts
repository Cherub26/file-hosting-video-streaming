import path from 'path';
import { PrismaClient } from '@prisma/client';
import { BlobServiceClient } from '@azure/storage-blob';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Request, Response } from 'express';
import { compressVideo, generateCompressedThumbnail, extractVideoMetadata } from '../services/videoService';
import { compressImage, generateImageThumbnail, extractImageMetadata, isImageFile } from '../services/imageService';
import { Readable } from 'stream';

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
      } else if (obj[key] instanceof Date) {
        newObj[key] = obj[key].toISOString();
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
          status: 'ready',
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
          status: 'ready',
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
          status: 'ready',
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

export async function getVideoMetadata(req: Request, res: Response) {
  const user = (req as any).user;
  const { blobName, videoId } = req.query;
  try {
    let video_id = videoId;
    if (!video_id && blobName) {
      // Find video id by blob name
      const file = await prisma.file.findFirst({ 
        where: { blob_name: String(blobName) }
      });
      if (!file) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      // Check if user is authenticated and in the same tenant as file
      if (!user || user.tenant_id !== file.tenant_id) {
        return res.status(403).json({ error: 'Forbidden - Access denied to videos outside your tenant' });
      }
      
      video_id = String(file.id);
    }
    if (!video_id) {
      return res.status(400).json({ error: 'Missing videoId or blobName' });
    }
    
    // If we have videoId directly, we need to check tenant access through the video
    if (videoId && !blobName) {
      const video = await prisma.video.findFirst({
        where: { id: Number(videoId) }
      });
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      // Check if user is authenticated and in the same tenant as video
      if (!user || user.tenant_id !== video.tenant_id) {
        return res.status(403).json({ error: 'Forbidden - Access denied to videos outside your tenant' });
      }
    }
    
    const metaResult = await prisma.metadata.findMany({ where: { video_id: Number(video_id) }, select: { key: true, value: true } });
    res.json({ metadata: metaResult });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metadata', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function getMyFiles(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get all files from the same tenant
    const files = await prisma.file.findMany({
      where: { 
        tenant_id: user.tenant_id
      },
      include: { tenant: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ files: convertBigIntToString(files) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch files', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function getMyVideos(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get all videos from the same tenant
    const videos = await prisma.video.findMany({
      where: { 
        tenant_id: user.tenant_id
      },
      include: { tenant: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ videos: convertBigIntToString(videos) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch videos', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function downloadFile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing file id' });
    
    // Require authentication
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to access files' });
    }
    
    const file = await prisma.file.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    // Check tenant access
    if (user.tenant_id !== file.tenant_id) {
      return res.status(403).json({ 
        error: 'Forbidden - Access denied to files outside your tenant'
      });
    }
    const blockBlobClient = containerClient.getBlockBlobClient(file.blob_name);
    const downloadResponse = await blockBlobClient.download();
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.type || 'application/octet-stream');
    if (downloadResponse.readableStreamBody) {
      downloadResponse.readableStreamBody.pipe(res);
    } else {
      res.status(500).json({ error: 'Failed to download file' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to download file', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function getFileByPublicId(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing file id' });
    
    // Require authentication
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to access files' });
    }
    
    const file = await prisma.file.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    // Check tenant access
    if (user.tenant_id !== file.tenant_id) {
      return res.status(403).json({ 
        error: 'Forbidden - Access denied to files outside your tenant'
      });
    }
    
    res.json({ file: convertBigIntToString(file) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch file', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function getVideoByPublicId(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check if user is authenticated and in the same tenant as video
    if (!user || user.tenant_id !== video.tenant_id) {
      return res.status(403).json({ error: 'Forbidden - Access denied to videos outside your tenant' });
    }
    
    res.json({ video: convertBigIntToString(video) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function downloadVideo(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    
    // Require authentication
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to access videos' });
    }
    
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check tenant access
    if (user.tenant_id !== video.tenant_id) {
      return res.status(403).json({ 
        error: 'Forbidden - Access denied to videos outside your tenant'
      });
    }

    if (!video.azure_url) {
      return res.status(404).json({ error: 'Video file not available for download' });
    }

    // Extract blob name from Azure URL
    const urlParts = video.azure_url.split('/');
    const blobName = urlParts[urlParts.length - 1];
    
    if (!blobName) {
      return res.status(500).json({ error: 'Invalid video URL format' });
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(video.title)}"`);
    res.setHeader('Content-Type', video.type || 'video/mp4');
    if (downloadResponse.readableStreamBody) {
      downloadResponse.readableStreamBody.pipe(res);
    } else {
      res.status(500).json({ error: 'Failed to download video' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to download video', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function serveVideo(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    
    // Require authentication
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to access videos' });
    }
    
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check tenant access
    if (user.tenant_id !== video.tenant_id) {
      return res.status(403).json({ 
        error: 'Forbidden - Access denied to videos outside your tenant'
      });
    }

    if (!video.azure_url) {
      return res.status(404).json({ error: 'Video file not available' });
    }

    // Extract blob name from Azure URL
    const urlParts = video.azure_url.split('/');
    const blobName = urlParts[urlParts.length - 1];
    
    if (!blobName) {
      return res.status(500).json({ error: 'Invalid video URL format' });
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();
    res.setHeader('Content-Type', video.type || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    
    if (downloadResponse.readableStreamBody) {
      downloadResponse.readableStreamBody.pipe(res);
    } else {
      res.status(500).json({ error: 'Failed to serve video' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to serve video', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function serveVideoThumbnail(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    
    // Require authentication
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to access video thumbnails' });
    }
    
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check tenant access
    if (user.tenant_id !== video.tenant_id) {
      return res.status(403).json({ 
        error: 'Forbidden - Access denied to videos outside your tenant'
      });
    }

    if (!video.thumb_url) {
      return res.status(404).json({ error: 'Video thumbnail not available' });
    }

    // Extract blob name from Azure URL
    const urlParts = video.thumb_url.split('/');
    const blobName = urlParts[urlParts.length - 1];
    
    if (!blobName) {
      return res.status(500).json({ error: 'Invalid thumbnail URL format' });
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    if (downloadResponse.readableStreamBody) {
      downloadResponse.readableStreamBody.pipe(res);
    } else {
      res.status(500).json({ error: 'Failed to serve thumbnail' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to serve thumbnail', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function getTenants(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all tenants with user count
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Convert to a simpler format for frontend
    const tenantList = tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      user_count: tenant._count.users,
      created_at: tenant.created_at
    }));

    res.json({ tenants: convertBigIntToString(tenantList) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenants', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function switchTenant(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { tenant_id } = req.body;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Verify the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(tenant_id) }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update user's tenant
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tenant_id: Number(tenant_id) },
      include: { tenant: true }
    });

    // Generate new JWT with updated tenant_id
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
    const newToken = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role, tenant_id: updatedUser.tenant_id }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Tenant switched successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        tenant_id: updatedUser.tenant_id
      },
      token: newToken
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch tenant', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
} 