import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/journal
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate, weather, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = `SELECT je.*, COALESCE(json_agg(jp.*) FILTER (WHERE jp.id IS NOT NULL),'[]') as photos
             FROM journal_entries je LEFT JOIN journal_photos jp ON jp."journalEntryId"=je.id
             WHERE je."userId"=$1`;
    const params: any[] = [req.user!.id];
    let i = 2;
    if (fromDate) { q += ` AND je."entryDate">=$${i++}`; params.push(fromDate); }
    if (toDate) { q += ` AND je."entryDate"<=$${i++}`; params.push(toDate); }
    if (weather) { q += ` AND je.weather=$${i++}`; params.push(weather); }
    q += ` GROUP BY je.id ORDER BY je."entryDate" DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(parseInt(limit), offset);
    const result = await pool.query(q, params);
    res.json({ success: true, entries: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/journal
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { weather, rainfallMm, activities, notes, entryDate, entryTime } = req.body;
    if (!entryDate) { res.status(400).json({ success: false, message: 'entryDate required' }); return; }
    const result = await pool.query(
      `INSERT INTO journal_entries (id,"userId",weather,"rainfallMm",activities,notes,"entryDate","entryTime") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [uuidv4(), req.user!.id, weather||null, rainfallMm||null, activities||null, notes||null, entryDate, entryTime||null]
    );
    res.status(201).json({ success: true, entry: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/journal/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT je.*, COALESCE(json_agg(jp.*) FILTER (WHERE jp.id IS NOT NULL),'[]') as photos
       FROM journal_entries je LEFT JOIN journal_photos jp ON jp."journalEntryId"=je.id
       WHERE je.id=$1 AND je."userId"=$2 GROUP BY je.id`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, entry: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/journal/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowed = ['weather','rainfallMm','activities','notes','entryDate','entryTime'];
    const updates: string[] = []; const values: any[] = []; let i = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) { updates.push(`"${key}"=$${i++}`); values.push(req.body[key]); }
    }
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields' }); return; }
    updates.push(`"updatedAt"=NOW()`); values.push(req.params.id, req.user!.id);
    const result = await pool.query(`UPDATE journal_entries SET ${updates.join(',')} WHERE id=$${i++} AND "userId"=$${i} RETURNING *`, values);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, entry: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/journal/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM journal_entries WHERE id=$1 AND "userId"=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/journal/:id/photos
router.post('/:id/photos', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await pool.query('SELECT id FROM journal_entries WHERE id=$1 AND "userId"=$2', [req.params.id, req.user!.id]);
    if (!entry.rows.length) { res.status(404).json({ success: false, message: 'Entry not found' }); return; }
    const { cloud_storage_path, isPublic } = req.body;
    if (!cloud_storage_path) { res.status(400).json({ success: false, message: 'cloud_storage_path required' }); return; }
    const result = await pool.query(
      `INSERT INTO journal_photos (id,"journalEntryId",cloud_storage_path,"isPublic") VALUES ($1,$2,$3,$4) RETURNING *`,
      [uuidv4(), req.params.id, cloud_storage_path, isPublic||false]
    );
    res.status(201).json({ success: true, photo: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/journal/:id/photos/:photoid
router.delete('/:id/photos/:photoid', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM journal_photos WHERE id=$1 AND "journalEntryId"=$2', [req.params.photoid, req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
