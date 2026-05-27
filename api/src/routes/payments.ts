import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const paymentsRouter = Router();

// Initiate PayFast payment
paymentsRouter.post('/initiate', authenticate, requireApproved, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan_id } = req.body;
    if (!plan_id) { res.status(400).json({ success: false, message: 'plan_id required' }); return; }

    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1 AND is_active = true', [plan_id]);
    if (!planResult.rows.length) { res.status(404).json({ success: false, message: 'Plan not found' }); return; }
    const plan = planResult.rows[0];

    const m_payment_id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO payments (user_id, plan_id, m_payment_id, item_name, amount_gross, payment_status) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user!.id, plan_id, m_payment_id, plan.name, plan.price_zar, 'pending']
    );

    const params: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.APP_URL || process.env.EXPO_PUBLIC_API_URL}/payment/success`,
      cancel_url: `${process.env.APP_URL || process.env.EXPO_PUBLIC_API_URL}/payment/cancel`,
      notify_url: `${process.env.API_URL || process.env.EXPO_PUBLIC_API_URL}/api/payments/notify`,
      name_first: req.user!.email.split('@')[0],
      email_address: req.user!.email,
      m_payment_id,
      amount: Number(plan.price_zar).toFixed(2),
      item_name: `Plaasboek ${plan.name} Subscription`,
      custom_str1: req.user!.id,
      custom_str2: plan_id,
    };

    const pfHost = process.env.PAYFAST_SANDBOX === 'true' ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
    const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const paymentUrl = `https://${pfHost}/eng/process?${query}`;

    res.json({ success: true, payment_url: paymentUrl, m_payment_id });
  } catch (err) {
    console.error('Payment initiate error:', err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});

// PayFast ITN webhook — MUST be /notify (no auth)
paymentsRouter.post('/notify', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Record<string, string>;
    const { payment_status, m_payment_id, custom_str1: userId, custom_str2: planId, pf_payment_id } = data;

    // Verify signature
    const pfParamString = Object.entries(data)
      .filter(([k]) => k !== 'signature')
      .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
      .join('&');
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    const signatureString = passphrase ? `${pfParamString}&passphrase=${encodeURIComponent(passphrase)}` : pfParamString;
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');

    if (signature !== data.signature) {
      console.warn('PayFast signature mismatch');
      res.status(400).send('Invalid signature');
      return;
    }

    await pool.query(
      'UPDATE payments SET payment_status=$1, payfast_pf_payment_id=$2, raw_itn=$3 WHERE m_payment_id=$4',
      [payment_status === 'COMPLETE' ? 'complete' : 'failed', pf_payment_id, JSON.stringify(data), m_payment_id]
    );

    if (payment_status === 'COMPLETE' && userId && planId) {
      const planResult = await pool.query('SELECT tier_name FROM plans WHERE id=$1', [planId]);
      if (planResult.rows.length) {
        const tier = planResult.rows[0].tier_name;
        await pool.query('UPDATE users SET tier=$1 WHERE id=$2', [tier, userId]);
        // Upsert subscription
        await pool.query(`
          INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at)
          VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 days')
          ON CONFLICT (user_id) DO UPDATE SET plan_id=$2, status='active', started_at=NOW(), expires_at=NOW() + INTERVAL '30 days'
        `, [userId, planId]);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('PayFast ITN error:', err);
    res.status(500).send('Error');
  }
});

// Get payment history
paymentsRouter.get('/history', authenticate, requireApproved, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT p.*, pl.name as plan_name FROM payments p LEFT JOIN plans pl ON p.plan_id=pl.id WHERE p.user_id=$1 ORDER BY p."createdAt" DESC',
      [req.user!.id]
    );
    res.json({ success: true, payments: result.rows });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch payment history' }); }
});

export default paymentsRouter;
