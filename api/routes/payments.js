const express = require('express');
const router = express.Router();

router.post('/initiate', async (req, res) => {
  res.json({ message: 'Payfast integration pending' });
});

router.post('/notify', async (req, res) => {
  // Payfast ITN webhook
  res.status(200).send('OK');
});

module.exports = router;
