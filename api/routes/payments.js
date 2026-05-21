const express = require('express');
const router = express.Router();
const { buildPaymentPayload, validateITN } = require('../services/payfastService');

// POST /api/payments/initiate
router.post('/initiate', async (req, res) => {
  try {
    const { userId, email, firstName, lastName, tier } = req.body;
    if (!userId || !email || !tier) {
      return res.status(400).json({ error: 'userId, email, and tier are required' });
    }
    const { payload, redirectUrl } = buildPaymentPayload({ userId, email, firstName, lastName, tier });
    res.json({ payload, redirectUrl, message: 'Redirect user to redirectUrl with payload as POST form' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/payments/notify — Payfast ITN webhook
router.post('/notify', async (req, res) => {
  try {
    const pfData = req.body;
    const pfParamString = Object.keys(pfData)
      .filter(k => k !== 'signature')
      .map(k => `${k}=${encodeURIComponent(pfData[k]).replace(/%20/g, '+')}`)
      .join('&');

    await validateITN(pfData, pfParamString);

    // TODO: update subscription status in DB based on pfData.payment_status
    // pfData.payment_status: 'COMPLETE' | 'FAILED' | 'PENDING'
    console.log(`ITN received: ${pfData.payment_status} for user ${pfData.custom_int1}`);

    res.status(200).send('OK');
  } catch (err) {
    console.error('ITN validation failed:', err.message);
    res.status(400).send('INVALID');
  }
});

// GET /api/payments/tiers — return available tiers
router.get('/tiers', (req, res) => {
  const { TIERS } = require('../services/payfastService');
  const formatted = Object.entries(TIERS).map(([name, cents]) => ({
    tier: name,
    amount_cents: parseInt(cents),
    amount_zar: (parseInt(cents) / 100).toFixed(2),
    currency: 'ZAR'
  }));
  res.json({ app: 'Plaasboek™', tiers: formatted });
});

module.exports = router;
