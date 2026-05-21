const express = require('express');
const router = express.Router();

router.get('/me', async (req, res) => {
  res.json({ message: 'User profile stub' });
});

module.exports = router;
