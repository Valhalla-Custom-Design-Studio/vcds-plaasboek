const express = require('express');
const router = express.Router();

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    // TODO: auth middleware, fetch user from DB
    res.json({ message: 'User profile stub' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
