import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/expenses/export (must be before /:id)
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query as any;
    const now = new Date();
    const y = parseInt(year || now.getFullYear());
    const m = parseInt(month || now.getMonth() + 1);
    const result = await pool.query(
      `SELECT date, category, description, amount FROM expenses
       WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3
       ORDER BY date`,
      [req.user!.id, y, m]
    );
    const rows = result.rows;
    const csv = ['Date,Category,Description,Amount (ZAR)', ...rows.map((r: any) =>
      `${r.date},${r.category},"${r.description}",${r.amount}`
    )].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${y}-${String(m).padStart(2,'0')}.csv"`);
    res.send(csv);
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/expenses
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { year, month, category, page = '1', limit = '50' } = req.query as any;
    const now = new Date();
    const y = parseInt(year || now.getFullYear());
    const m = parseInt(month || now.getMonth() + 1);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['user_id=$1', `EXTRACT(YEAR FROM date)=$2`, `EXTRACT(MONTH FROM date)=$3`];
    const values: any[] = [req.user!.id, y, m];
    let idx = 4;
    if (category) { conditions.push(`category=$${idx++}`); values.push(category); }
    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT * FROM expenses WHERE ${where} ORDER BY date DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, parseInt(limit), offset]
    );
    const summary = await pool.query(
      `SELECT
         SUM(CASE WHEN EXTRACT(MONTH FROM date)=$3 AND EXTRACT(YEAR FROM date)=$2 THEN amount ELSE 0 END) as monthly_total,
         SUM(CASE WHEN EXTRACT(YEAR FROM date)=$2 THEN amount ELSE 0 END) as yearly_total,
         category, SUM(amount) as cat_total
       FROM expenses WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2
       GROUP BY category`,
      [req.user!.id, y, m]
    );
    const categoryBreakdown: Record<string, number> = {};
    let monthlyTotal = 0, yearlyTotal = 0;
    summary.rows.forEach((r: any) => {
      categoryBreakdown[r.category] = parseFloat(r.cat_total);
      monthlyTotal = parseFloat(r.monthly_total);
      yearlyTotal = parseFloat(r.yearly_total);
    });
    res.json({ success: true, items: result.rows, summary: { monthlyTotal, yearlyTotal, categoryBreakdown } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/expenses
router.post('/', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, category, description, date } = req.body;
    if (!amount || !category || !description || !date) {
      res.status(400).json({ success: false, message: 'amount, category, description, date required' }); return;
    }
    const result = await pool.query(
      'INSERT INTO expenses (user_id, amount, category, description, date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user!.id, amount, category, description, date]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/expenses/:id
router.delete('/:id', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
