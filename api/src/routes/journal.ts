import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/journal
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate, weather, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['je.user_id=$1'];
    const values: any[] = [req.user!.id];
    let idx = 2;
    if (fromDate) { conditions.push(`je.entry_date>=$${idx++}`); values.push(fromDate); }
    if (toDate) { conditions.push(`je.entry_date<=$${idx++}`); values.push(toDate); }
    if (weather) { conditions.push(`je.weather=$${idx++}`); values.push(weather); }
    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT je.*, COUNT(jp.id)::int as photo_count
       FROM journal_entries je
       LEFT JOIN journal_photos jp ON jp.journal_entry_id=je.id
       WHERE ${where}
       GROUP BY je.id
       ORDER BY je.entry_date DESC, je.entry_time DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, parseInt(limit), offset]
    );
    const total = await pool.query(`SELECT COUNT(*) FROM journal_entries je WHERE ${where}`, values);
    res.json({ success: true, items: result.rows, total: parseInt(total.rows[0].count), page: parseInt(page) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/journal
router.post('/', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const { weather, rainfallMm, activities, notes, entryDate, entryTime } = req.body;
    if (!entryDate) { res.status(400).json({ success: false, message: 'entryDate required' }); return; }
    const result = await pool.query(
      `INSERT INTO journal_entries (user_id, weather, rainfall_mm, activities, notes, entry_date, entry_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user!.id, weather||null, rainfallMm||null, activities||null, notes||null, entryDate, entryTime||null]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/journal/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM journal_entries WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const photos = await pool.query('SELECT * FROM journal_photos WHERE journal_entry_id=$1 ORDER BY created_at', [req.params.id]);
    res.json({ success: true, item: { ...result.rows[0], photos: photos.rows } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/journal/:id
router.patch('/:id', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const { weather, rainfallMm, activities, notes, entryDate, entryTime } = req.body;
    const result = await pool.query(
      `UPDATE journal_entries SET weather=$1, rainfall_mm=$2, activities=$3, notes=$4, entry_date=COALESCE($5,entry_date), entry_time=COALESCE($6,entry_time), updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [weather||null, rainfallMm||null, activities||null, notes||null, entryDate||null, entryTime||null, req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, item: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/journal/:id
router.delete('/:id', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM journal_entries WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/journal/:id/photos
router.post('/:id/photos', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const entry = await pool.query('SELECT id FROM journal_entries WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    if (!entry.rows.length) { res.status(404).json({ success: false, message: 'Entry not found' }); return; }
    const { cloud_storage_path, isPublic } = req.body;
    const result = await pool.query(
      'INSERT INTO journal_photos (journal_entry_id, cloud_storage_path, is_public) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, cloud_storage_path, isPublic || false]
    );
    res.status(201).json({ success: true, photo: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/journal/:id/photos/:photoId
router.delete('/:id/photos/:photoId', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM journal_photos jp USING journal_entries je WHERE jp.id=$1 AND jp.journal_entry_id=je.id AND je.user_id=$2',
      [req.params.photoId, req.user!.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
