import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateJWT, optionalAuthJWT } from '../middlewares/auth';
import { handleUpload, getVideoMetadata, getMyFiles, getMyVideos, downloadFile, getFileByPublicId, getVideoByPublicId, downloadVideo, serveVideo, serveVideoThumbnail, getTenants, switchTenant, changeFileVisibility, changeVideoVisibility } from '../controllers/uploadController';
import { fileSizeLimit } from '../middlewares/fileSizeLimit';

const router = express.Router();

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "524288000", 10); // 500MB default
const upload = multer({
  dest: path.join(__dirname, '../../../uploads/'),
  limits: { fileSize: MAX_FILE_SIZE }
});

// Upload endpoint: POST /upload
router.post('/upload', authenticateJWT, upload.single('file'), fileSizeLimit, handleUpload);

// Metadata endpoint: GET /metadata
router.get('/metadata', getVideoMetadata);

// List my files endpoint: GET /my-files
router.get('/my-files', authenticateJWT, getMyFiles);

// List my videos endpoint: GET /my-videos
router.get('/my-videos', authenticateJWT, getMyVideos);

// Download file endpoint: GET /download/:id (id is public_id)
router.get('/download/:id', optionalAuthJWT, downloadFile);

// Get file details by public_id
router.get('/file/:id', optionalAuthJWT, getFileByPublicId);

// Get video details by public_id
router.get('/video/:id', optionalAuthJWT, getVideoByPublicId);

// Download video endpoint: GET /download-video/:id (id is public_id)
router.get('/download-video/:id', optionalAuthJWT, downloadVideo);

// Serve video for playback: GET /serve-video/:id (id is public_id)
router.get('/serve-video/:id', optionalAuthJWT, serveVideo);

// Serve video thumbnail: GET /serve-video-thumbnail/:id (id is public_id)
router.get('/serve-video-thumbnail/:id', optionalAuthJWT, serveVideoThumbnail);

// Get all tenants
router.get('/tenants', authenticateJWT, getTenants);

// Switch tenant
router.post('/switch-tenant', authenticateJWT, switchTenant);

// Change file visibility
router.put('/file/:id/visibility', authenticateJWT, changeFileVisibility);

// Change video visibility
router.put('/video/:id/visibility', authenticateJWT, changeVideoVisibility);

export default router; 