import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// POST /api/sync — batch sync offline actions
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { actions } = req.body;
    if (!Array.isArray(actions)) {
      res.status(400).json({ success: false, message: 'actions array required' }); return;
    }
    const results: any[] = [];
    for (const action of actions) {
      try {
        const { type, data } = action;
        let result: any = null;
        switch (type) {
          case 'journal:create':
            result = await pool.query(
              'INSERT INTO journal_entries (user_id, weather, rainfall_mm, activities, notes, entry_date, entry_time) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
              [req.user!.id, data.weather||null, data.rainfallMm||null, data.activities||null, data.notes||null, data.entryDate, data.entryTime||null]
            );
            break;
          case 'rainfall:create':
            result = await pool.query(
              'INSERT INTO rainfall_entries (user_id, date, amount_mm) VALUES ($1,$2,$3) ON CONFLICT (user_id, date) DO UPDATE SET amount_mm=$3 RETURNING id',
              [req.user!.id, data.date, data.amountMm]
            );
            break;
          case 'expense:create':
            result = await pool.query(
              'INSERT INTO expenses (user_id, amount, category, description, date) VALUES ($1,$2,$3,$4,$5) RETURNING id',
              [req.user!.id, data.amount, data.category, data.description, data.date]
            );
            break;
          case 'livestock:change':
            const camp = await pool.query('SELECT id FROM camps WHERE id=$1 AND user_id=$2', [data.campId, req.user!.id]);
            if (camp.rows.length) {
              result = await pool.query(
                'INSERT INTO livestock_changes (camp_id, user_id, type, reason, quantity, notes, date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
                [data.campId, req.user!.id, data.type, data.reason, data.quantity, data.notes||null, data.date]
              );
              const delta = data.type === 'addition' ? parseInt(data.quantity) : -parseInt(data.quantity);
              await pool.query('UPDATE camps SET current_count=current_count+$1 WHERE id=$2', [delta, data.campId]);
            }
            break;
        }
        results.push({ type, success: true, id: result?.rows?.[0]?.id });
      } catch (e: any) {
        results.push({ type: action.type, success: false, error: e.message });
      }
    }
    res.json({ success: true, results });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
