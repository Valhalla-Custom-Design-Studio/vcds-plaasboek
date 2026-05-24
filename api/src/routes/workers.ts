import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM workers WHERE "farmerId"=$1 ORDER BY name ASC', [req.user!.id]);
    res.json({ success: true, workers: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, idNumber, position } = req.body;
    if (!name || !idNumber || !position) { res.status(400).json({ success: false, message: 'name, idNumber, position required' }); return; }
    if (!/^\d{13}$/.test(idNumber)) { res.status(400).json({ success: false, message: 'SA ID number must be 13 digits' }); return; }
    const result = await pool.query(
      `INSERT INTO workers (id,"farmerId",name,"idNumber",position) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [uuidv4(), req.user!.id, name, idNumber, position]
    );
    res.status(201).json({ success: true, worker: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, position } = req.body;
    const result = await pool.query(
      `UPDATE workers SET name=COALESCE($1,name),position=COALESCE($2,position),"updatedAt"=NOW() WHERE id=$3 AND "farmerId"=$4 RETURNING *`,
      [name||null, position||null, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, worker: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM workers WHERE id=$1 AND "farmerId"=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DAILY LOGS
router.get('/:workerId/logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query as any;
    let q = `SELECT wdl.* FROM worker_daily_logs wdl JOIN workers w ON w.id=wdl."workerId" WHERE wdl."workerId"=$1 AND w."farmerId"=$2`;
    const params: any[] = [req.params.workerId, req.user!.id]; let i = 3;
    if (year) { q += ` AND EXTRACT(YEAR FROM wdl.date)=$${i++}`; params.push(year); }
    if (month) { q += ` AND EXTRACT(MONTH FROM wdl.date)=$${i++}`; params.push(month); }
    q += ` ORDER BY wdl.date DESC`;
    const result = await pool.query(q, params);
    const daysPresent = result.rows.filter((r:any)=>r.present).length;
    const totalHours = result.rows.reduce((s:number,r:any)=>s+(parseFloat(r.hoursWorked)||0),0);
    res.json({ success: true, logs: result.rows, summary: { daysPresent, totalHours: parseFloat(totalHours.toFixed(2)), taskCount: result.rows.filter((r:any)=>r.tasks).length } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:workerId/logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, present, hoursWorked, tasks } = req.body;
    if (!date) { res.status(400).json({ success: false, message: 'date required' }); return; }
    const result = await pool.query(
      `INSERT INTO worker_daily_logs (id,"workerId","farmerId",date,present,"hoursWorked",tasks) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ("workerId",date) DO UPDATE SET present=$5,"hoursWorked"=$6,tasks=$7 RETURNING *`,
      [uuidv4(), req.params.workerId, req.user!.id, date, present!==false, hoursWorked||null, tasks||null]
    );
    res.status(201).json({ success: true, log: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:workerId/logs/:logId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM worker_daily_logs WHERE id=$1 AND "workerId"=$2', [req.params.logId, req.params.workerId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
