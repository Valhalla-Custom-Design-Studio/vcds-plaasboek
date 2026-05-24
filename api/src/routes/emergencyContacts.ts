import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM emergency_contacts WHERE "userId"=$1 ORDER BY priority DESC, "createdAt" ASC', [req.user!.id]);
    res.json({ success: true, contacts: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, category, relationship } = req.body;
    if (!name || !phone) { res.status(400).json({ success: false, message: 'name and phone required' }); return; }
    const count = await pool.query('SELECT COUNT(*) FROM emergency_contacts WHERE "userId"=$1', [req.user!.id]);
    if (parseInt(count.rows[0].count) >= 20) { res.status(400).json({ success: false, message: 'Maximum 20 contacts reached' }); return; }
    const result = await pool.query(
      `INSERT INTO emergency_contacts (id,"userId",name,phone,category,relationship) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuidv4(), req.user!.id, name, phone, category||'other', relationship||null]
    );
    res.status(201).json({ success: true, contact: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, category, relationship, priority } = req.body;
    const result = await pool.query(
      `UPDATE emergency_contacts SET name=COALESCE($1,name),phone=COALESCE($2,phone),category=COALESCE($3,category),relationship=COALESCE($4,relationship),priority=COALESCE($5,priority) WHERE id=$6 AND "userId"=$7 RETURNING *`,
      [name||null, phone||null, category||null, relationship||null, priority||null, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, contact: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM emergency_contacts WHERE id=$1 AND "userId"=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
