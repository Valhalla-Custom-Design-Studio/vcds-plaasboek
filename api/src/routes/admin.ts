import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { status, role, page = '1', limit = '50' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (status) { conditions.push(`status=$${idx++}`); values.push(status); }
    if (role) { conditions.push(`role=$${idx++}`); values.push(role); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(
      `SELECT id, email, name, farm_name, role, status, tier, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, parseInt(limit), offset]
    );
    const total = await pool.query(`SELECT COUNT(*) FROM users ${where}`, values);
    res.json({ success: true, items: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['approved','rejected','pending'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' }); return;
    }
    const result = await pool.query(
      'UPDATE users SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, name, status',
      [status, req.params.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/sos-events
router.get('/sos-events', async (req: AuthRequest, res: Response) => {
  try {
    const { resolved, page = '1', limit = '50' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (resolved !== undefined) { conditions.push(`se.resolved=$${idx++}`); values.push(resolved === 'true'); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(
      `SELECT se.*, u.name as sender_name, u.farm_name FROM sos_events se
       JOIN users u ON u.id=se.sender_id ${where}
       ORDER BY se.timestamp DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, parseInt(limit), offset]
    );
    res.json({ success: true, items: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/admin/sos-events/:id/resolve
router.patch('/sos-events/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE sos_events SET resolved=true, resolved_by=$1, resolved_at=NOW() WHERE id=$2',
      [req.user!.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/admin/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [users, activeSOS, recentSignups, unresolvedOld] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM sos_events WHERE resolved=false"),
      pool.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query("SELECT COUNT(*) FROM sos_events WHERE resolved=false AND timestamp < NOW() - INTERVAL '24 hours'"),
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        activeSOS: parseInt(activeSOS.rows[0].count),
        recentSignups: parseInt(recentSignups.rows[0].count),
        unresolvedOver24h: parseInt(unresolvedOld.rows[0].count),
      }
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
