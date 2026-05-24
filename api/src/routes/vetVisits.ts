import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireApproved);

// GET /api/vet-visits/expiring (before /:id)
router.get('/expiring', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vet_visits WHERE user_id=$1 AND safe_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' ORDER BY safe_date`,
      [req.user!.id]
    );
    res.json({ success: true, items: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/vet-visits
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await pool.query(
      'SELECT * FROM vet_visits WHERE user_id=$1 ORDER BY visit_date DESC LIMIT $2 OFFSET $3',
      [req.user!.id, parseInt(limit), offset]
    );
    res.json({ success: true, items: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/vet-visits
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { animalId, treatment, medication, dosage, withdrawalDays, visitDate } = req.body;
    if (!animalId || !treatment || !medication || !dosage || !visitDate) {
      res.status(400).json({ success: false, message: 'animalId, treatment, medication, dosage, visitDate required' }); return;
    }
    const wd = parseInt(withdrawalDays) || 0;
    const safeDate = new Date(visitDate);
    safeDate.setDate(safeDate.getDate() + wd);
    const result = await pool.query(
      `INSERT INTO vet_visits (user_id, animal_id, treatment, medication, dosage, withdrawal_days, visit_date, safe_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.id, animalId, treatment, medication, dosage, wd, visitDate, safeDate.toISOString().split('T')[0]]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/vet-visits/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM vet_visits WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
