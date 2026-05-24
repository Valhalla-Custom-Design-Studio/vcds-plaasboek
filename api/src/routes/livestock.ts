import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/camps
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM camps WHERE user_id=$1 ORDER BY name', [req.user!.id]);
    res.json({ success: true, items: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/camps
router.post('/', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'name required' }); return; }
    const result = await pool.query(
      'INSERT INTO camps (user_id, name) VALUES ($1,$2) RETURNING *',
      [req.user!.id, name]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/camps/:id
router.patch('/:id', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'UPDATE camps SET name=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *',
      [name, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/camps/:id
router.delete('/:id', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM camps WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/camps/:campId/changes
router.get('/:campId/changes', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const camp = await pool.query('SELECT id FROM camps WHERE id=$1 AND user_id=$2', [req.params.campId, req.user!.id]);
    if (!camp.rows.length) { res.status(404).json({ success: false, message: 'Camp not found' }); return; }
    const result = await pool.query(
      'SELECT * FROM livestock_changes WHERE camp_id=$1 ORDER BY date DESC LIMIT $2 OFFSET $3',
      [req.params.campId, parseInt(limit), offset]
    );
    res.json({ success: true, items: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/camps/:campId/changes
router.post('/:campId/changes', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const { type, reason, quantity, notes, date } = req.body;
    if (!type || !reason || !quantity || !date) {
      res.status(400).json({ success: false, message: 'type, reason, quantity, date required' }); return;
    }
    const camp = await pool.query('SELECT id FROM camps WHERE id=$1 AND user_id=$2', [req.params.campId, req.user!.id]);
    if (!camp.rows.length) { res.status(404).json({ success: false, message: 'Camp not found' }); return; }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const change = await client.query(
        'INSERT INTO livestock_changes (camp_id, user_id, type, reason, quantity, notes, date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [req.params.campId, req.user!.id, type, reason, quantity, notes||null, date]
      );
      const delta = type === 'addition' ? parseInt(quantity) : -parseInt(quantity);
      await client.query('UPDATE camps SET current_count=current_count+$1, updated_at=NOW() WHERE id=$2', [delta, req.params.campId]);
      await client.query('COMMIT');
      res.status(201).json({ success: true, item: change.rows[0] });
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
