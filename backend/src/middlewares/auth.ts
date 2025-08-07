import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, AuthenticatedUser } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Middleware: authenticate JWT
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded as AuthenticatedUser;
    next();
  });
}

// Middleware: require role
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Middleware: optional JWT authentication (sets user if token is valid, but doesn't require it)
export function optionalAuthJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // No auth header, continue without user
    req.user = undefined;
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    // Malformed token, continue without user
    req.user = undefined;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Invalid token, continue without user
      req.user = undefined;
      return next();
    }
    // Valid token, set user and continue
    req.user = decoded as AuthenticatedUser;
    next();
  });
} 