import express from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { getTenants, switchTenant } from '../controllers/tenantController';

const router = express.Router();

// Get all tenants
router.get('/tenants', authenticateJWT, getTenants);

// Switch tenant
router.post('/switch-tenant', authenticateJWT, switchTenant);

export default router; 