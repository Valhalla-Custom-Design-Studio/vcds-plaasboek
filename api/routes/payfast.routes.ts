import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db';

const router = Router();

router.post('/payfast/webhook', async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    const received = data.signature;
    delete data.signature;

    const str = Object.keys(data)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
      .join('&');
    const expected = crypto.createHash('md5').update(str).digest('hex');

    if (received !== expected) {
      return res.status(400).send('Invalid signature');
    }

    if (data.payment_status === 'COMPLETE') {
      const { custom_str1: userId, custom_str2: tier, m_payment_id } = data;

      if (!userId || !tier) {
        return res.status(400).json({ error: 'Missing userId or tier in webhook payload' });
      }

      const validTiers = ['free', 'basic', 'pro', 'premium'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({ error: `Invalid tier: ${tier}` });
      }

      await pool.query(
        `UPDATE users
         SET subscription_tier = $1,
             subscription_status = 'active',
             subscription_updated_at = NOW(),
             payfast_payment_id = $2
         WHERE id = $3`,
        [tier, m_payment_id, userId]
      );
    }

    if (data.payment_status === 'CANCELLED') {
      const { custom_str1: userId } = data;
      if (userId) {
        await pool.query(
          `UPDATE users
           SET subscription_tier = 'free',
               subscription_status = 'cancelled',
               subscription_updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );
      }
    }

    return res.status(200).send('OK');
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
