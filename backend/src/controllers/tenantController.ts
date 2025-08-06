import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/helpers';

const prisma = new PrismaClient();

export async function getTenants(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all tenants with user count
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Convert to a simpler format for frontend
    const tenantList = tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      user_count: tenant._count.users,
      created_at: tenant.created_at
    }));

    res.json({ tenants: convertBigIntToString(tenantList) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenants', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
}

export async function switchTenant(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { tenant_id } = req.body;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Verify the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(tenant_id) }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update user's tenant
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tenant_id: Number(tenant_id) },
      include: { tenant: true }
    });

    // Generate new JWT with updated tenant_id
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
    const newToken = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role, tenant_id: updatedUser.tenant_id }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Tenant switched successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        tenant_id: updatedUser.tenant_id
      },
      token: newToken
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch tenant', details: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
  }
} 