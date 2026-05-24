import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/emergency-contacts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM emergency_contacts WHERE user_id=$1 ORDER BY priority DESC, created_at',
      [req.user!.id]
    );
    res.json({ success: true, items: result.rows, count: result.rows.length });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/emergency-contacts
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const count = await pool.query('SELECT COUNT(*) FROM emergency_contacts WHERE user_id=$1', [req.user!.id]);
    if (parseInt(count.rows[0].count) >= 20) {
      res.status(400).json({ success: false, message: 'Maximum 20 contacts reached' }); return;
    }
    const { name, phone, category, relationship } = req.body;
    if (!name || !phone || !category) {
      res.status(400).json({ success: false, message: 'name, phone, category required' }); return;
    }
    const result = await pool.query(
      'INSERT INTO emergency_contacts (user_id, name, phone, category, relationship) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user!.id, name, phone, category, relationship||null]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/emergency-contacts/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, category, relationship, priority } = req.body;
    const result = await pool.query(
      `UPDATE emergency_contacts SET
         name=COALESCE($1,name), phone=COALESCE($2,phone), category=COALESCE($3,category),
         relationship=COALESCE($4,relationship), priority=COALESCE($5,priority)
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [name||null, phone||null, category||null, relationship||null, priority??null, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/emergency-contacts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM emergency_contacts WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
