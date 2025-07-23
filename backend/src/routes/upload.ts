import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateJWT } from '../middlewares/auth';
import { handleUpload, getVideoMetadata, getMyFiles, getMyVideos, downloadFile, getFileByPublicId, getVideoByPublicId } from '../controllers/uploadController';
import { fileSizeLimit } from '../middlewares/fileSizeLimit';

const router = express.Router();

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "524288000", 10); // 500MB default
const upload = multer({
  dest: path.join(__dirname, '../../../uploads/'),
  limits: { fileSize: MAX_FILE_SIZE }
});

// Upload endpoint: POST /upload
router.post('/upload', authenticateJWT, upload.single('video'), fileSizeLimit, handleUpload);

// Metadata endpoint: GET /metadata
router.get('/metadata', getVideoMetadata);

// List my files endpoint: GET /my-files
router.get('/my-files', authenticateJWT, getMyFiles);

// List my videos endpoint: GET /my-videos
router.get('/my-videos', authenticateJWT, getMyVideos);

// Download file endpoint: GET /download/:id (id is public_id)
router.get('/download/:id', authenticateJWT, downloadFile);

// Get file details by public_id
router.get('/file/:id', authenticateJWT, getFileByPublicId);

// Get video details by public_id
router.get('/video/:id', authenticateJWT, getVideoByPublicId);

export default router; 