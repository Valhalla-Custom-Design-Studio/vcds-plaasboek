import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireApproved);

// GET /api/workers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!['farmer','admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Farmer or admin access required' }); return;
    }
    const result = await pool.query('SELECT * FROM workers WHERE farmer_id=$1 ORDER BY name', [req.user!.id]);
    res.json({ success: true, items: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/workers
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, idNumber, position } = req.body;
    if (!name || !idNumber || !position) {
      res.status(400).json({ success: false, message: 'name, idNumber, position required' }); return;
    }
    if (!/^\d{13}$/.test(idNumber)) {
      res.status(400).json({ success: false, message: 'SA ID number must be 13 digits' }); return;
    }
    const result = await pool.query(
      'INSERT INTO workers (farmer_id, name, id_number, position) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user!.id, name, idNumber, position]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/workers/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, idNumber, position } = req.body;
    const result = await pool.query(
      `UPDATE workers SET name=COALESCE($1,name), id_number=COALESCE($2,id_number), position=COALESCE($3,position), updated_at=NOW()
       WHERE id=$4 AND farmer_id=$5 RETURNING *`,
      [name||null, idNumber||null, position||null, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/workers/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM workers WHERE id=$1 AND farmer_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/workers/:workerId/logs
router.get('/:workerId/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query as any;
    const now = new Date();
    const y = parseInt(year || now.getFullYear());
    const m = parseInt(month || now.getMonth() + 1);
    const worker = await pool.query('SELECT id FROM workers WHERE id=$1 AND farmer_id=$2', [req.params.workerId, req.user!.id]);
    if (!worker.rows.length) { res.status(404).json({ success: false, message: 'Worker not found' }); return; }
    const result = await pool.query(
      `SELECT * FROM worker_daily_logs WHERE worker_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3 ORDER BY date DESC`,
      [req.params.workerId, y, m]
    );
    const logs = result.rows;
    const daysPresent = logs.filter((l: any) => l.present).length;
    const totalHours = logs.reduce((s: number, l: any) => s + (parseFloat(l.hours_worked) || 0), 0);
    res.json({ success: true, items: logs, summary: { daysPresent, totalHours, taskCount: logs.filter((l: any) => l.tasks).length } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/workers/:workerId/logs
router.post('/:workerId/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { date, present, hoursWorked, tasks } = req.body;
    if (!date) { res.status(400).json({ success: false, message: 'date required' }); return; }
    const worker = await pool.query('SELECT id FROM workers WHERE id=$1 AND farmer_id=$2', [req.params.workerId, req.user!.id]);
    if (!worker.rows.length) { res.status(404).json({ success: false, message: 'Worker not found' }); return; }
    const result = await pool.query(
      `INSERT INTO worker_daily_logs (worker_id, farmer_id, date, present, hours_worked, tasks)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (worker_id, date) DO UPDATE SET present=$4, hours_worked=$5, tasks=$6 RETURNING *`,
      [req.params.workerId, req.user!.id, date, present !== false, hoursWorked||null, tasks||null]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/workers/:workerId/logs/:logId
router.delete('/:workerId/logs/:logId', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM worker_daily_logs WHERE id=$1 AND farmer_id=$2', [req.params.logId, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
