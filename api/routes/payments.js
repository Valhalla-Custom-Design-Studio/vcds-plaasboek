const express = require('express');
const router = express.Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { buildPaymentPayload, validateITN } = require('../services/payfastService');

// POST /api/payments/initiate
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { tier } = req.body;
    const { id: userId, email, first_name: firstName, last_name: lastName } = req.user;
    if (!tier) return res.status(400).json({ error: 'tier is required' });

    const result = buildPaymentPayload({ userId, email, firstName, lastName, tier });
    if (result.free) {
      // Activate free tier immediately
      await db.query(
        `INSERT INTO subscriptions (user_id, tier, status, amount_cents, current_period_start, current_period_end)
         VALUES ($1, $2, 'active', 0, NOW(), NOW() + INTERVAL '30 days')
         ON CONFLICT (user_id) DO UPDATE SET tier=$2, status='active', updated_at=NOW()`,
        [userId, tier]
      );
      return res.json({ free: true, message: 'Free tier activated' });
    }

    // Create pending subscription record
    await db.query(
      `INSERT INTO subscriptions (user_id, tier, status, amount_cents, current_period_start)
       VALUES ($1, $2, 'pending', $3, NOW())`,
      [userId, tier, parseInt(result.payload.amount * 100)]
    );

    res.json({ payload: result.payload, redirectUrl: result.redirectUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/payments/notify — Payfast ITN
router.post('/notify', async (req, res) => {
  try {
    const pfData = req.body;
    const pfParamString = Object.keys(pfData)
      .filter(k => k !== 'signature')
      .map(k => `${k}=${encodeURIComponent(pfData[k]).replace(/%20/g, '+')}`)
      .join('&');

    await validateITN(pfData, pfParamString);

    // Record payment
    await db.query(
      `INSERT INTO payments (user_id, m_payment_id, payfast_payment_id, amount_gross, amount_fee, amount_net,
       payment_status, item_name, custom_str1, custom_str2, custom_int1, itn_raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (m_payment_id) DO NOTHING`,
      [
        pfData.custom_int1, pfData.m_payment_id, pfData.pf_payment_id,
        pfData.amount_gross, pfData.amount_fee, pfData.amount_net,
        pfData.payment_status, pfData.item_name,
        pfData.custom_str1, pfData.custom_str2, pfData.custom_int1,
        JSON.stringify(pfData)
      ]
    );

    // Update subscription status
    if (pfData.payment_status === 'COMPLETE') {
      await db.query(
        `UPDATE subscriptions SET status='active',
         current_period_start=NOW(), current_period_end=NOW() + INTERVAL '30 days',
         updated_at=NOW()
         WHERE user_id=$1 AND tier=$2`,
        [pfData.custom_int1, pfData.custom_str1]
      );
    } else if (pfData.payment_status === 'FAILED' || pfData.payment_status === 'CANCELLED') {
      await db.query(
        `UPDATE subscriptions SET status='failed', updated_at=NOW()
         WHERE user_id=$1 AND tier=$2`,
        [pfData.custom_int1, pfData.custom_str1]
      );
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('ITN error:', err.message);
    res.status(400).send('INVALID');
  }
});

// GET /api/payments/tiers
router.get('/tiers', (req, res) => {
  const { TIERS } = require('../services/payfastService');
  const formatted = Object.entries(TIERS).map(([name, cents]) => ({
    tier: name,
    amount_cents: parseInt(cents),
    amount_zar: (parseInt(cents) / 100).toFixed(2),
    currency: 'ZAR',
    free: parseInt(cents) === 0
  }));
  res.json({ tiers: formatted });
});

module.exports = router;
