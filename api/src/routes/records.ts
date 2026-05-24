import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const recordsRouter = Router();

recordsRouter.use(authenticateToken);

recordsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query(
      'SELECT * FROM farm_records WHERE user_id = $1 ORDER BY date DESC LIMIT 200',
      [userId]
    );
    res.json(result.rows.map(r => ({
      id: r.id, type: r.type, desc: r.desc_af, desc_en: r.desc_en,
      amount: parseFloat(r.amount), date: r.date, category: r.category, synced: true,
    })));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
});

recordsRouter.post('/', async (req: Request, res: Response) => {
  const { type, desc, desc_en, amount, date, category } = req.body;
  if (!type || !amount || !date) { res.status(400).json({ success: false, message: 'type, amount, date required' }); return; }
  try {
    const userId = (req as any).user.id;
    const result = await pool.query(
      'INSERT INTO farm_records (user_id, type, desc_af, desc_en, amount, date, category) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [userId, type, desc || desc_en, desc_en || desc, amount, date, category || 'Ander']
    );
    const r = result.rows[0];
    res.status(201).json({ id: r.id, type: r.type, desc: r.desc_af, desc_en: r.desc_en, amount: parseFloat(r.amount), date: r.date, category: r.category, synced: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save record' });
  }
});

recordsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await pool.query('DELETE FROM farm_records WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete record' });
  }
});

export default recordsRouter;
