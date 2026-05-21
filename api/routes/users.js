const express = require('express');
const router = express.Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, first_name, last_name, phone, avatar_url, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name), phone = COALESCE($3, phone),
       updated_at = NOW() WHERE id = $4
       RETURNING id, email, first_name, last_name, phone`,
      [firstName, lastName, phone, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
