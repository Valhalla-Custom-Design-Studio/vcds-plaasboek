import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const adminOnly = (req: AuthRequest, res: Response, next: any) => {
  if (req.user?.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
  next();
};
router.use(adminOnly);

router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, role, page = '1', limit = '50' } = req.query as any;
    const offset = (parseInt(page)-1)*parseInt(limit);
    let q = `SELECT id,email,name,"farmName",role,status,tier,"createdAt" FROM users WHERE 1=1`;
    const params: any[] = []; let i = 1;
    if (status) { q += ` AND status=$${i++}`; params.push(status); }
    if (role) { q += ` AND role=$${i++}`; params.push(role); }
    q += ` ORDER BY "createdAt" DESC LIMIT $${i++} OFFSET $${i++}`; params.push(parseInt(limit), offset);
    const result = await pool.query(q, params);
    res.json({ success: true, users: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/users/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['approved','rejected','pending'].includes(status)) { res.status(400).json({ success: false, message: 'Invalid status' }); return; }
    const result = await pool.query(`UPDATE users SET status=$1,"updatedAt"=NOW() WHERE id=$2 RETURNING id,email,name,status`, [status, req.params.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/sos-events', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resolved, page = '1', limit = '50' } = req.query as any;
    const offset = (parseInt(page)-1)*parseInt(limit);
    let q = `SELECT se.*,u.name as "senderName",u."farmName" as "senderFarm" FROM sos_events se JOIN users u ON u.id=se."senderId" WHERE 1=1`;
    const params: any[] = []; let i = 1;
    if (resolved !== undefined) { q += ` AND se.resolved=$${i++}`; params.push(resolved==='true'); }
    q += ` ORDER BY se."createdAt" DESC LIMIT $${i++} OFFSET $${i++}`; params.push(parseInt(limit), offset);
    const result = await pool.query(q, params);
    res.json({ success: true, events: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/sos-events/:id/resolve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(`UPDATE sos_events SET resolved=true,"resolvedBy"=$1,"resolvedAt"=NOW() WHERE id=$2`, [req.user!.id, req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [users, activeSos, recentSignups, unresolvedOld] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM sos_events WHERE resolved=false'),
      pool.query(`SELECT COUNT(*) FROM users WHERE "createdAt">NOW()-INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*) FROM sos_events WHERE resolved=false AND "createdAt"<NOW()-INTERVAL '24 hours'`),
    ]);
    res.json({ success: true, stats: {
      totalUsers: parseInt(users.rows[0].count),
      activeSos: parseInt(activeSos.rows[0].count),
      recentSignups: parseInt(recentSignups.rows[0].count),
      unresolvedOver24h: parseInt(unresolvedOld.rows[0].count),
    }});
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
