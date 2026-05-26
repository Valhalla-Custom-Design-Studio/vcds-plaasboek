import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireTier(tier: 'world' | 'sa' | 'platinum') {
  const order = ['world', 'sa', 'platinum'];
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    // Inline check — swap for DB lookup in production
    const userTier = (req as any).user?.tier || 'world';
    if (order.indexOf(userTier) < order.indexOf(tier)) {
      return res.status(403).json({ error: `${tier} tier required` });
    }
    next();
  };
}
