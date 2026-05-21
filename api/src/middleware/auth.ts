import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; tier: string; };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireTier = (minTier: 'free' | 'basic' | 'pro' | 'enterprise') => {
  const tierOrder = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    if (tierOrder[req.user.tier as keyof typeof tierOrder] < tierOrder[minTier]) {
      res.status(403).json({ success: false, message: `Requires ${minTier} tier or higher` });
      return;
    }
    next();
  };
};
