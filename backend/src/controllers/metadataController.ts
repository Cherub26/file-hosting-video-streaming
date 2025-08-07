import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export async function getVideoMetadata(req: Request, res: Response) {
  const user = req.user;
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