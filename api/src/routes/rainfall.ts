import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/rainfall
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query as any;
    const now = new Date();
    const y = parseInt(year || now.getFullYear());
    const m = parseInt(month || now.getMonth() + 1);
    const result = await pool.query(
      `SELECT * FROM rainfall_entries WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3 ORDER BY date`,
      [req.user!.id, y, m]
    );
    const entries = result.rows;
    const total = entries.reduce((s: number, e: any) => s + parseFloat(e.amount_mm), 0);
    const avg = entries.length ? total / entries.length : 0;
    // Longest dry spell
    let maxDry = 0, curDry = 0;
    const daysInMonth = new Date(y, m, 0).getDate();
    const dateSet = new Set(entries.map((e: any) => new Date(e.date).getDate()));
    for (let d = 1; d <= daysInMonth; d++) {
      if (!dateSet.has(d)) { curDry++; maxDry = Math.max(maxDry, curDry); } else { curDry = 0; }
    }
    res.json({ success: true, entries, summary: { total: Math.round(total * 10) / 10, average: Math.round(avg * 10) / 10, longestDrySpell: maxDry } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/rainfall
router.post('/', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const { date, amountMm } = req.body;
    if (!date || amountMm === undefined) { res.status(400).json({ success: false, message: 'date and amountMm required' }); return; }
    if (parseFloat(amountMm) < 0) { res.status(400).json({ success: false, message: 'Amount cannot be negative' }); return; }
    const result = await pool.query(
      `INSERT INTO rainfall_entries (user_id, date, amount_mm) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, date) DO UPDATE SET amount_mm=$3 RETURNING *`,
      [req.user!.id, date, amountMm]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/rainfall/:id
router.delete('/:id', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM rainfall_entries WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
