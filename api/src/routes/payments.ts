import { Router, Request, Response } from 'express';
import { validateITN, buildPaymentUrl } from '../services/PayFastService';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

export const paymentsRouter = Router();

// PayFast ITN webhook (no auth — PayFast calls this)
paymentsRouter.post('/itn', async (req: Request, res: Response) => {
  try {
    const isValid = await validateITN(req.body);
    if (!isValid) { res.status(400).send('INVALID'); return; }
    const { payment_status, custom_str1: userId, custom_str2: planId, amount_gross } = req.body;
    if (payment_status === 'COMPLETE') {
      await pool.query(
        'INSERT INTO payments (user_id, plan_id, amount_zar, status, payfast_payment_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [userId, planId, parseFloat(amount_gross), 'completed', req.body.pf_payment_id]
      );
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, started_at, next_billing_date) VALUES ($1,$2,$3,NOW(),NOW() + INTERVAL '1 month') ON CONFLICT (user_id) DO UPDATE SET plan_id=$2, status=$3, next_billing_date=NOW() + INTERVAL '1 month'`,
        [userId, planId, 'active']
      );
      await pool.query('UPDATE users SET tier = (SELECT tier_name FROM plans WHERE id = $1) WHERE id = $2', [planId, userId]);
    }
    res.send('OK');
  } catch { res.status(500).send('ERROR'); }
});

// Generate PayFast payment URL
paymentsRouter.post('/initiate', authenticate, async (req: AuthRequest, res: Response) => {
  const { planId } = req.body;
  if (!planId) { res.status(400).json({ success: false, message: 'planId required' }); return; }
  try {
    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
    if (!planResult.rows.length) { res.status(404).json({ success: false, message: 'Plan not found' }); return; }
    const plan = planResult.rows[0];
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user!.id]);
    const user = userResult.rows[0];
    const paymentUrl = buildPaymentUrl({
      amount: plan.price_zar, itemName: plan.name, itemDescription: plan.description,
      email: user.email, firstName: user.first_name, lastName: user.last_name,
      subscriptionType: 1, frequency: 3, cycles: 0,
      customStr1: user.id, customStr2: plan.id,
    });
    res.json({ success: true, paymentUrl });
  } catch { res.status(500).json({ success: false, message: 'Failed to initiate payment' }); }
});
