import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, month, category, page = '1', limit = '50' } = req.query as any;
    const offset = (parseInt(page)-1)*parseInt(limit);
    let q = `SELECT * FROM expenses WHERE "userId"=$1`; const params: any[] = [req.user!.id]; let i = 2;
    if (year) { q += ` AND EXTRACT(YEAR FROM date)=$${i++}`; params.push(year); }
    if (month) { q += ` AND EXTRACT(MONTH FROM date)=$${i++}`; params.push(month); }
    if (category) { q += ` AND category=$${i++}`; params.push(category); }
    q += ` ORDER BY date DESC LIMIT $${i++} OFFSET $${i++}`; params.push(parseInt(limit), offset);
    const result = await pool.query(q, params);
    // Summary
    const allQ = `SELECT amount, category, EXTRACT(YEAR FROM date) as yr, EXTRACT(MONTH FROM date) as mo FROM expenses WHERE "userId"=$1`;
    const allResult = await pool.query(allQ, [req.user!.id]);
    const now = new Date();
    const monthlyTotal = allResult.rows.filter((r:any) => parseInt(r.yr)===now.getFullYear() && parseInt(r.mo)===now.getMonth()+1).reduce((s:number,r:any)=>s+parseFloat(r.amount),0);
    const yearlyTotal = allResult.rows.filter((r:any) => parseInt(r.yr)===now.getFullYear()).reduce((s:number,r:any)=>s+parseFloat(r.amount),0);
    const categoryBreakdown: Record<string,number> = {};
    allResult.rows.forEach((r:any) => { categoryBreakdown[r.category] = (categoryBreakdown[r.category]||0)+parseFloat(r.amount); });
    res.json({ success: true, items: result.rows, summary: { monthlyTotal: parseFloat(monthlyTotal.toFixed(2)), yearlyTotal: parseFloat(yearlyTotal.toFixed(2)), categoryBreakdown } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, category, description, date } = req.body;
    if (!amount || !category || !description || !date) { res.status(400).json({ success: false, message: 'amount, category, description, date required' }); return; }
    const result = await pool.query(
      `INSERT INTO expenses (id,"userId",amount,category,description,date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuidv4(), req.user!.id, parseFloat(amount), category, description, date]
    );
    res.status(201).json({ success: true, expense: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1 AND "userId"=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// CSV Export
router.get('/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query as any;
    let q = `SELECT date,category,description,amount FROM expenses WHERE "userId"=$1`; const params: any[] = [req.user!.id]; let i = 2;
    if (year) { q += ` AND EXTRACT(YEAR FROM date)=$${i++}`; params.push(year); }
    if (month) { q += ` AND EXTRACT(MONTH FROM date)=$${i++}`; params.push(month); }
    q += ` ORDER BY date DESC`;
    const result = await pool.query(q, params);
    const csv = ['Date,Category,Description,Amount (ZAR)', ...result.rows.map((r:any) => `${r.date},${r.category},"${r.description}",${r.amount}`)].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="plaasboek-expenses-${year||'all'}-${month||'all'}.csv"`);
    res.send(csv);
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
