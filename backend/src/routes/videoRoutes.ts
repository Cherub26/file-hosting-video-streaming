import express from 'express';
import { authenticateJWT, optionalAuthJWT } from '../middlewares/auth';
import { getMyVideos, getVideoByPublicId, downloadVideo, serveVideo, serveVideoThumbnail, changeVideoVisibility } from '../controllers/videoController';

const router = express.Router();

// List my videos endpoint: GET /my-videos
router.get('/my-videos', authenticateJWT, getMyVideos);

// Get video details by public_id
router.get('/video/:id', optionalAuthJWT, getVideoByPublicId);

// Download video endpoint: GET /download-video/:id (id is public_id)
router.get('/download-video/:id', optionalAuthJWT, downloadVideo);

// Serve video for playback: GET /serve-video/:id (id is public_id)
router.get('/serve-video/:id', optionalAuthJWT, serveVideo);

// Serve video thumbnail: GET /serve-video-thumbnail/:id (id is public_id)
router.get('/serve-video-thumbnail/:id', optionalAuthJWT, serveVideoThumbnail);

// Change video visibility
router.post('/video/:id/visibility', authenticateJWT, changeVideoVisibility);

export default router; 