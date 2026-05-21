const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    res.status(201).json({ message: 'User registered' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const token = jwt.sign({ userId: 'placeholder' }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
