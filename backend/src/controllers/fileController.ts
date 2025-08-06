import { PrismaClient } from '@prisma/client';
import { BlobServiceClient } from '@azure/storage-blob';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/helpers';

const prisma = new PrismaClient();
const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING || '';
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || '';
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

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

export async function downloadFile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const publicId = req.params.id;
    if (!publicId) return res.status(400).json({ error: 'Missing file id' });
    
    const file = await prisma.file.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    // Check access based on visibility
    if (file.visibility === 'private') {
      // Private files require authentication and tenant access
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to access private files' });
      }
      if (user.tenant_id !== file.tenant_id) {
        return res.status(403).json({ 
          error: 'Forbidden - Access denied to private files outside your tenant'
        });
      }
    }
    // Public files can be accessed by anyone
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
    
    const file = await prisma.file.findFirst({ 
      where: { public_id: publicId }
    });
    
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    // Check access based on visibility
    if (file.visibility === 'private') {
      // Private files require authentication and tenant access
      if (!user) {
        return res.status(401).json({ error: 'Authentication required to access private files' });
      }
      if (user.tenant_id !== file.tenant_id) {
        return res.status(403).json({ 
          error: 'Forbidden - Access denied to private files outside your tenant'
        });
      }
    }
    // Public files can be accessed by anyone
    
    res.json({ file: convertBigIntToString(file) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch file', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function changeFileVisibility(req: Request, res: Response) {
  const user = (req as any).user;
  const { id } = req.params; // public_id
  const { visibility } = req.body;

  if (!visibility || (visibility !== 'public' && visibility !== 'private')) {
    return res.status(400).json({ error: 'Valid visibility value (public or private) is required' });
  }

  try {
    // Find the file and check if user has access (same tenant)
    const file = await prisma.file.findFirst({
      where: {
        public_id: id,
        tenant_id: user.tenant_id,
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Update the visibility
    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: { visibility },
    });

    res.json({ 
      message: 'File visibility updated successfully',
      file: convertBigIntToString(updatedFile)
    });
  } catch (err) {
    const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err);
    res.status(500).json({ error: 'Failed to update file visibility', details: errorMsg });
  }
} 