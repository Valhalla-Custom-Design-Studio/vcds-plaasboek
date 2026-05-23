import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), db: 'connected' });
  } catch {
    res.status(503).json({ success: false, status: 'unhealthy', db: 'disconnected' });
  }
});

export default healthRouter;
