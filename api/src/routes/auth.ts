import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { pool } from '../db/pool';

export const authRouter = Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  preferredLocale: Joi.string().valid('en', 'af').default('en'),
});

authRouter.post('/register', async (req: Request, res: Response) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) { res.status(400).json({ success: false, message: error.details[0].message }); return; }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [value.email]);
    if (existing.rows.length > 0) { res.status(409).json({ success: false, message: 'Email already registered' }); return; }
    const passwordHash = await bcrypt.hash(value.password, 12);
    const userId = uuidv4();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, preferred_locale, tier) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, value.email, passwordHash, value.firstName, value.lastName, value.preferredLocale, 'free']
    );
    const token = jwt.sign({ id: userId, email: value.email, tier: 'free' }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.status(201).json({ success: true, token, user: { id: userId, email: value.email, tier: 'free' } });
  } catch (err) { res.status(500).json({ success: false, message: 'Registration failed' }); }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ success: false, message: 'Email and password required' }); return; }
  try {
    const result = await pool.query('SELECT id, email, password_hash, tier FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return; }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return; }
    const token = jwt.sign({ id: user.id, email: user.email, tier: user.tier }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email, tier: user.tier } });
  } catch { res.status(500).json({ success: false, message: 'Login failed' }); }
});
