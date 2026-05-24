import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { token, deviceType } = req.body;
    if (!token) { res.status(400).json({ success: false, message: 'token required' }); return; }
    await pool.query(
      'INSERT INTO push_tokens (user_id, token, device_type) VALUES ($1,$2,$3) ON CONFLICT (token) DO UPDATE SET user_id=$1, device_type=$3',
      [req.user!.id, token, deviceType || null]
    );
    res.status(201).json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:token', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM push_tokens WHERE token=$1 AND user_id=$2', [req.params.token, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
