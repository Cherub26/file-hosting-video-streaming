import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateJWT } from '../middlewares/auth';
import { handleUpload, getVideoMetadata } from '../controllers/uploadController';
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

export default router; 