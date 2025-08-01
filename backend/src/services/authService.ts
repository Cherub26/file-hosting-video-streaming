import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export type UserRole = 'Visitor' | 'User' | 'Admin';

// Register a new user
export async function registerUser(username: string, email: string, password: string, role: UserRole = 'User', tenant_id?: number) {
  const password_hash = await bcrypt.hash(password, 10);
  
  // If no tenant_id provided, create a default tenant or use existing one
  let finalTenantId = tenant_id;
  if (!finalTenantId) {
    // Create a default tenant for the user
    const defaultTenant = await prisma.tenant.create({
      data: {
        name: `${username}'s Organization`,
      },
    });
    finalTenantId = defaultTenant.id;
  }
  
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password_hash,
      role,
      tenant_id: finalTenantId,
    },
  });
  return user;
}

// Login user
export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return user;
}

// Generate JWT
export function generateJWT(user: any) {
  return jwt.sign({ id: user.id, role: user.role, tenant_id: user.tenant_id }, JWT_SECRET, { expiresIn: '7d' });
} 