const express = require('express');
const router = express.Router();

// POST /api/payments/initiate — initiate Payfast payment
router.post('/initiate', async (req, res) => {
  try {
    // TODO: build Payfast payload, generate signature, return redirect URL
    res.json({ message: 'Payment initiation stub — Payfast integration pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/notify — Payfast ITN webhook
router.post('/notify', async (req, res) => {
  try {
    // TODO: validate ITN, update subscription status in DB
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
