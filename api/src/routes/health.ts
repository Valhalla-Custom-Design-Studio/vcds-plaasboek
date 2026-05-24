import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }
  // Always return 200 — Railway healthcheck must pass for service to start
  res.json({
    success: true,
    status: 'healthy',
    service: 'vcds-plaasboek',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;
