import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'disconnected';
  }
  // Always return 200 so Railway healthcheck passes during startup
  res.status(200).json({
    success: true,
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;
