import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const workersRouter = Router();
workersRouter.use(authenticateToken);

workersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query('SELECT * FROM workers WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch workers' }); }
});

workersRouter.post('/', async (req: Request, res: Response) => {
  const { name, role, wage, phone } = req.body;
  if (!name || !wage) { res.status(400).json({ success: false, message: 'name and wage required' }); return; }
  try {
    const userId = (req as any).user.id;
    const result = await pool.query(
      'INSERT INTO workers (user_id, name, role, wage, phone, active) VALUES ($1,$2,$3,$4,$5,true) RETURNING *',
      [userId, name, role || '', wage, phone || '']
    );
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ success: false, message: 'Failed to save worker' }); }
});

workersRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { active } = req.body;
    const result = await pool.query('UPDATE workers SET active = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [active, req.params.id, userId]);
    res.json(result.rows[0]);
  } catch { res.status(500).json({ success: false, message: 'Failed to update worker' }); }
});

export default workersRouter;
