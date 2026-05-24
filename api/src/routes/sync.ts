import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { actions } = req.body;
    if (!Array.isArray(actions)) { res.status(400).json({ success: false, message: 'actions array required' }); return; }
    const results: any[] = [];
    for (const action of actions) {
      try {
        const { type, data } = action;
        let result: any = null;
        if (type === 'journal.create') {
          const r = await pool.query(
            `INSERT INTO journal_entries (id,"userId",weather,"rainfallMm",activities,notes,"entryDate","entryTime") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING *`,
            [data.id||uuidv4(), req.user!.id, data.weather||null, data.rainfallMm||null, data.activities||null, data.notes||null, data.entryDate, data.entryTime||null]
          );
          result = r.rows[0];
        } else if (type === 'rainfall.create') {
          const r = await pool.query(
            `INSERT INTO rainfall_entries (id,"userId",date,"amountMm") VALUES ($1,$2,$3,$4) ON CONFLICT ("userId",date) DO UPDATE SET "amountMm"=$4 RETURNING *`,
            [data.id||uuidv4(), req.user!.id, data.date, data.amountMm]
          );
          result = r.rows[0];
        } else if (type === 'expense.create') {
          const r = await pool.query(
            `INSERT INTO expenses (id,"userId",amount,category,description,date) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING *`,
            [data.id||uuidv4(), req.user!.id, data.amount, data.category, data.description, data.date]
          );
          result = r.rows[0];
        }
        results.push({ type, success: true, result });
      } catch (e: any) {
        results.push({ type: action.type, success: false, error: e.message });
      }
    }
    res.json({ success: true, results });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
