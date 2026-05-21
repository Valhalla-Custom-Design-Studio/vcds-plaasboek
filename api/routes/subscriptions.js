const express = require('express');
const router = express.Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/subscriptions/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json(rows[0] || { status: 'none' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
