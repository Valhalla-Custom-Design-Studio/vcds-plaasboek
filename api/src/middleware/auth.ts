import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; tier: string; status: string; };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireApproved(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
  if (req.user.status !== 'active') {
    res.status(403).json({ success: false, message: 'Account pending approval. Contact support.' });
    return;
  }
  next();
}

export function requirePro(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
  if (req.user.tier !== 'pro') {
    res.status(403).json({ success: false, message: 'Pro subscription required. Upgrade at /api/payments/initiate' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
}
