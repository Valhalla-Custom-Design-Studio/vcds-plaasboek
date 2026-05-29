import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const DEFAULT_CONTACTQ€= [
  { name: 'SAPS', phone: '10111', category: 'saps' },
  { name: 'Ambulansie', phone: '10177', category: 'ambulance' },
  { name: 'Brandweer', phone: '10177', category: 'fire' },
];

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, farmName } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ success: false, message: 'E-pos, wagwoord en naam benodig. | Email, password and name required.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Wagwoord moet minstens 8 karakters lank wees. | Password must be at least 8 characters.' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [normalizedEmail]);
    if (exists.rows.length) {
      res.status(409).json({ success: false, message: 'E-pos bestaan reeds. | Email already registered.' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const result = await pool.query(`INSERT INTO users (id,email,password,name,farm_name,role,status) VALUES ($1,$2,$3,$4,$5,'farmer','pending') RETURNING id,email,name,farm_name,role,status,tier,language,created_at`, [id, normalizedEmail, hashed, name, farmName || null]);
    const user = result.rows[0];
    for (const c of DEFAULT_CONTACTS) {
      await pool.query(`INSERT INTO emergency_contacts (id,user_id,name,phone,category,is_default) VALUES ($1,$2,$3,$4,$5,true)`, [uuidv4(), id, c.name, c.phone, c.category]);
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tier: user.tier }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'E-pos en wagwoord benodig. | Email and password required.' });
      return;
    }
    const result = await pool.query('SELECT id, email, password, name, farm_name, role, status, tier, language FROM users WHERE email=$1', [email.trim().toLowerCase()]);
    if (!result.rows.length) {
      res.status(401).json({ success: false, message: 'Ongeldige e-pos of wagwoord. | Invalid email or password.' });
      return;
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Ongeldige e-pos of wagwoord. | Invalid email or password.' });
      return;
    }
    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tier: user.tier || 'free' }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ success: true, token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`SELECT id, email, name, farm_name, role, status, tier, language, latitude, longitude, plot_number, gate_latitude, gate_longitude, nearest_town, alert_radius_km, blood_type, allergies, chronic_conditions, medications, medical_aid_name, medical_aid_number, nearest_hospital, doctor_name, doctor_phone, created_at, updated_at FROM users WHERE id=$1`, [req.user!.id]);
    if (!result.rows.length) {
      res.status(404).json({ success: false, message: 'Gebruiker nie gevind nie. | User not found.' });
      return;
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
