import { PrismaClient } from '@prisma/client';
import { BlobServiceClient } from '@azure/storage-blob';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/helpers';

const prisma = new PrismaClient();
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING || '';
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || '';
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

export async function getMyVideos(req: Request, res: Response) {
  try {
    const user = req.user;
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

export async function getVideoByPublicId(req: Request, res: Response) {
  try {
    const user = req.user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check access based on visibility
    if (video.visibility === 'private') {
      // Private videos require authentication and tenant access
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to access private videos' });
      }
      if (user.tenant_id !== video.tenant_id) {
        return res.status(403).json({ error: 'Forbidden - Access denied to private videos outside your tenant' });
      }
    }
    // Public videos can be accessed by anyone
    
    res.json({ video: convertBigIntToString(video) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function downloadVideo(req: Request, res: Response) {
  try {
    const user = req.user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check access based on visibility
    if (video.visibility === 'private') {
      // Private videos require authentication and tenant access
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to access private videos' });
      }
      if (user.tenant_id !== video.tenant_id) {
        return res.status(403).json({ 
          error: 'Forbidden - Access denied to private videos outside your tenant'
        });
      }
    }
    // Public videos can be accessed by anyone

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
    const user = req.user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check access based on visibility
    if (video.visibility === 'private') {
      // Private videos require authentication and tenant access
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to access private videos' });
      }
      if (user.tenant_id !== video.tenant_id) {
        return res.status(403).json({ 
          error: 'Forbidden - Access denied to private videos outside your tenant'
        });
      }
    }
    // Public videos can be accessed by anyone

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
    const user = req.user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing video id' });
    
    const video = await prisma.video.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Check access based on visibility
    if (video.visibility === 'private') {
      // Private video thumbnails require authentication and tenant access
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to access private video thumbnails' });
      }
      if (user.tenant_id !== video.tenant_id) {
        return res.status(403).json({ 
          error: 'Forbidden - Access denied to private videos outside your tenant'
        });
      }
    }
    // Public video thumbnails can be accessed by anyone

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

export async function changeVideoVisibility(req: Request, res: Response) {
  const user = req.user;
  const { id } = req.params; // public_id
  const { visibility } = req.body;

  if (!user || !user.tenant_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!visibility || (visibility !== 'public' && visibility !== 'private')) {
    return res.status(400).json({ error: 'Valid visibility value (public or private) is required' });
  }

  try {
    // Find the video and check if user has access (same tenant)
    const video = await prisma.video.findFirst({
      where: {
        public_id: id,
        tenant_id: user.tenant_id,
      },
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }

    // Update the visibility
    const updatedVideo = await prisma.video.update({
      where: { id: video.id },
      data: { visibility },
    });

    res.json({ 
      message: 'Video visibility updated successfully',
      video: convertBigIntToString(updatedVideo)
    });
  } catch (err) {
    const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err);
    res.status(500).json({ error: 'Failed to update video visibility', details: errorMsg });
  }
} 