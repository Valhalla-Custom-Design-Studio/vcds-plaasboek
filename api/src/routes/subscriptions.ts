import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

export const subscriptionRouter = Router();
subscriptionRouter.use(authenticate);

subscriptionRouter.get('/current', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT s.*, p.name as plan_name, p.price_zar, p.features FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.user_id = $1 AND s.status = $2',
      [req.user!.id, 'active']
    );
    res.json({ success: true, subscription: result.rows[0] || null });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch subscription' }); }
});

subscriptionRouter.get('/plans', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM plans WHERE is_active = true ORDER BY price_zar ASC');
    res.json({ success: true, plans: result.rows });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch plans' }); }
});
