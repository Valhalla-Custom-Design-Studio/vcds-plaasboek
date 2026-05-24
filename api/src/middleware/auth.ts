import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; tier: string };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  // Reject JWT in query params (security hardening KAN-43)
  if (req.query.token || req.query.jwt || req.query.access_token) {
    res.status(400).json({ success: false, message: 'Token must be sent in Authorization header, not query params' });
    return;
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = { id: payload.id, email: payload.email, tier: payload.tier };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
