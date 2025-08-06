import express from 'express';
import { getVideoMetadata } from '../controllers/metadataController';

const router = express.Router();

// Metadata endpoint: GET /metadata
router.get('/metadata', getVideoMetadata);

export default router; 