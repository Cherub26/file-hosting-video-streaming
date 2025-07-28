import { Request, Response } from 'express';
import { registerUser, loginUser, generateJWT } from '../services/authService';

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const user = await registerUser(username, email, password);
    res.json({
      message: 'Registration successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role, tenant_id: user.tenant_id }
    });
  } catch (err: any) {
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const user = await loginUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = generateJWT(user);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, tenant_id: user.tenant_id } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
} 