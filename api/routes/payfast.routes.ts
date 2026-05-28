import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db/pool';

const router = Router();

router.post('/payfast/webhook', async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    // Validate PayFast signature
    const received = data.signature;
    delete data.signature;
    const str = Object.keys(data)
      .sort()
      .map((k: string) => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
      .join('&');
    const expected = crypto.createHash('md5').update(str).digest('hex');
    if (received !== expected) {
      return res.status(400).send('Invalid signature');
    }
    // Update subscription on payment_status=COMPLETE
    if (data.payment_status === 'COMPLETE') {
      const { m_payment_id, custom_str1: userId, custom_str2: tier } = data;
      // Update user tier in DB
      await pool.query(
        `UPDATE users SET subscription_tier = $1, subscription_ref = $2, updated_at = NOW() WHERE id = $3`,
        [tier, m_payment_id, userId]
      );
    }
    return res.status(200).send('OK');
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
