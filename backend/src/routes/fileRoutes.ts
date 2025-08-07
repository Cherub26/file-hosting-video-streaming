import express from 'express';
import { authenticateJWT, optionalAuthJWT } from '../middlewares/auth';
import { getMyFiles, downloadFile, serveFile, getFileByPublicId, changeFileVisibility } from '../controllers/fileController';

const router = express.Router();

// List my files endpoint: GET /my-files
router.get('/my-files', authenticateJWT, getMyFiles);

// Download file endpoint: GET /download/:id (id is public_id)
router.get('/download/:id', optionalAuthJWT, downloadFile);

// Serve file for viewing/preview: GET /serve-file/:id (id is public_id)
router.get('/serve-file/:id', optionalAuthJWT, serveFile);

// Get file details by public_id
router.get('/file/:id', optionalAuthJWT, getFileByPublicId);

// Change file visibility
router.post('/file/:id/visibility', authenticateJWT, changeFileVisibility);

export default router; 