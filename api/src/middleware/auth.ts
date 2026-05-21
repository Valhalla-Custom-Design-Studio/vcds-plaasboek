import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export interface AuthRequest extends Request { user?: { id: string; email: string; tier: string; }; }
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ success: false, message: 'No token' }); return; }
  try { req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user']; next(); }
  catch { res.status(401).json({ success: false, message: 'Invalid token' }); }
};
