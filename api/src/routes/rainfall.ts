import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query as any;
    let q = `SELECT * FROM rainfall_entries WHERE "userId"=$1`;
    const params: any[] = [req.user!.id]; let i = 2;
    if (year) { q += ` AND EXTRACT(YEAR FROM date)=$${i++}`; params.push(year); }
    if (month) { q += ` AND EXTRACT(MONTH FROM date)=$${i++}`; params.push(month); }
    q += ` ORDER BY date DESC`;
    const result = await pool.query(q, params);
    const entries = result.rows;
    const total = entries.reduce((s: number, e: any) => s + parseFloat(e.amountMm), 0);
    const avg = entries.length ? total / entries.length : 0;
    // Longest dry spell
    let longestDry = 0, currentDry = 0;
    const sorted = [...entries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (let j = 1; j < sorted.length; j++) {
      const diff = Math.floor((new Date(sorted[j].date).getTime() - new Date(sorted[j-1].date).getTime()) / 86400000) - 1;
      if (diff > 0) { currentDry += diff; longestDry = Math.max(longestDry, currentDry); } else { currentDry = 0; }
    }
    res.json({ success: true, entries, summary: { total: parseFloat(total.toFixed(2)), average: parseFloat(avg.toFixed(2)), longestDrySpell: longestDry } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, amountMm } = req.body;
    if (!date || amountMm === undefined) { res.status(400).json({ success: false, message: 'date and amountMm required' }); return; }
    if (parseFloat(amountMm) < 0) { res.status(400).json({ success: false, message: 'amountMm cannot be negative' }); return; }
    const result = await pool.query(
      `INSERT INTO rainfall_entries (id,"userId",date,"amountMm") VALUES ($1,$2,$3,$4) ON CONFLICT ("userId",date) DO UPDATE SET "amountMm"=$4 RETURNING *`,
      [uuidv4(), req.user!.id, date, amountMm]
    );
    res.status(201).json({ success: true, entry: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM rainfall_entries WHERE id=$1 AND "userId"=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
