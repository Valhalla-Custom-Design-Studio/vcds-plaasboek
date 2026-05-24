import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// CAMPS
router.get('/camps', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM camps WHERE "userId"=$1 ORDER BY "createdAt" ASC', [req.user!.id]);
    res.json({ success: true, camps: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/camps', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'name required' }); return; }
    const result = await pool.query(
      `INSERT INTO camps (id,"userId",name) VALUES ($1,$2,$3) RETURNING *`,
      [uuidv4(), req.user!.id, name]
    );
    res.status(201).json({ success: true, camp: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/camps/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      `UPDATE camps SET name=$1,"updatedAt"=NOW() WHERE id=$2 AND "userId"=$3 RETURNING *`,
      [name, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, camp: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/camps/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM camps WHERE id=$1 AND "userId"=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// LIVESTOCK CHANGES
router.get('/camps/:campId/changes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const result = await pool.query(
      `SELECT lc.* FROM livestock_changes lc JOIN camps c ON c.id=lc."campId" WHERE lc."campId"=$1 AND c."userId"=$2 ORDER BY lc.date DESC LIMIT $3 OFFSET $4`,
      [req.params.campId, req.user!.id, parseInt(limit), offset]
    );
    res.json({ success: true, changes: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/camps/:campId/changes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, reason, quantity, notes, date } = req.body;
    if (!type || !reason || !quantity || !date) { res.status(400).json({ success: false, message: 'type, reason, quantity, date required' }); return; }
    const camp = await pool.query('SELECT id FROM camps WHERE id=$1 AND "userId"=$2', [req.params.campId, req.user!.id]);
    if (!camp.rows.length) { res.status(404).json({ success: false, message: 'Camp not found' }); return; }
    const result = await pool.query(
      `INSERT INTO livestock_changes (id,"campId","userId",type,reason,quantity,notes,date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [uuidv4(), req.params.campId, req.user!.id, type, reason, parseInt(quantity), notes||null, date]
    );
    // Update camp count
    const delta = type === 'addition' ? parseInt(quantity) : -parseInt(quantity);
    await pool.query(`UPDATE camps SET "currentCount"="currentCount"+$1,"updatedAt"=NOW() WHERE id=$2`, [delta, req.params.campId]);
    res.status(201).json({ success: true, change: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// VET VISITS
router.get('/vet-visits', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const result = await pool.query(
      `SELECT * FROM vet_visits WHERE "userId"=$1 ORDER BY "visitDate" DESC LIMIT $2 OFFSET $3`,
      [req.user!.id, parseInt(limit), offset]
    );
    res.json({ success: true, visits: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/vet-visits/expiring', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM vet_visits WHERE "userId"=$1 AND "safeDate" BETWEEN NOW() AND NOW()+INTERVAL '7 days' ORDER BY "safeDate" ASC`,
      [req.user!.id]
    );
    res.json({ success: true, visits: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/vet-visits', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { animalId, treatment, medication, dosage, withdrawalDays, visitDate } = req.body;
    if (!animalId || !treatment || !medication || !dosage || !visitDate) {
      res.status(400).json({ success: false, message: 'animalId, treatment, medication, dosage, visitDate required' }); return;
    }
    const wd = parseInt(withdrawalDays) || 0;
    const safeDate = new Date(visitDate);
    safeDate.setDate(safeDate.getDate() + wd);
    const result = await pool.query(
      `INSERT INTO vet_visits (id,"userId","animalId",treatment,medication,dosage,"withdrawalDays","visitDate","safeDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [uuidv4(), req.user!.id, animalId, treatment, medication, dosage, wd, visitDate, safeDate.toISOString().split('T')[0]]
    );
    res.status(201).json({ success: true, visit: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/vet-visits/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM vet_visits WHERE id=$1 AND "userId"=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
