import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const livestockRouter = Router();
livestockRouter.use(authenticateToken);

livestockRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query('SELECT * FROM livestock WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch livestock' }); }
});

livestockRouter.post('/', async (req: Request, res: Response) => {
  const { name, type, count, notes } = req.body;
  if (!name || !count) { res.status(400).json({ success: false, message: 'name and count required' }); return; }
  try {
    const userId = (req as any).user.id;
    const result = await pool.query(
      'INSERT INTO livestock (user_id, name, type, count, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, name, type || 'Ander', count, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ success: false, message: 'Failed to save livestock' }); }
});

export default livestockRouter;
