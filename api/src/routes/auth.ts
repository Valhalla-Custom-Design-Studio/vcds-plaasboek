import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const authRouter = Router();

const DEFAULT_CONTACTS = [
  { name: 'SAPS', phone: '10111', category: 'saps' },
  { name: 'Ambulance', phone: '10177', category: 'ambulance' },
  { name: 'Fire', phone: '10177', category: 'fire' },
];

// POST /api/signup
authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, farmName } = req.body;
    if (!email || !password || !name) { res.status(400).json({ success: false, message: 'email, password, name required' }); return; }
    if (password.length < 8) { res.status(400).json({ success: false, message: 'Password must be at least 8 characters' }); return; }
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows.length) { res.status(409).json({ success: false, message: 'Email already registered' }); return; }
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO users (id,email,password,name,"farmName",role,status) VALUES ($1,$2,$3,$4,$5,'farmer','pending') RETURNING id,email,name,"farmName",role,status,tier,language,"createdAt"`,
      [id, email.toLowerCase(), hashed, name, farmName || null]
    );
    const user = result.rows[0];
    // Seed default emergency contacts
    for (const c of DEFAULT_CONTACTS) {
      await pool.query(
        `INSERT INTO emergency_contacts (id,"userId",name,phone,category,"isDefault") VALUES ($1,$2,$3,$4,$5,true)`,
        [uuidv4(), id, c.name, c.phone, c.category]
      );
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tier: user.tier }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ success: false, message: 'email and password required' }); return; }
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!result.rows.length) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return; }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return; }
    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tier: user.tier }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.json({ success: true, token, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT id,email,name,"farmName",role,status,tier,language,"plotNumber","gateLatitude","gateLongitude","nearestTown","alertRadiusKm","bloodType",allergies,"chronicConditions",medications,"medicalAidName","medicalAidNumber","nearestHospital","doctorName","doctorPhone","createdAt" FROM users WHERE id=$1', [req.user!.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/me
authRouter.patch('/users/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowed = ['name','farmName','latitude','longitude','sosRadius','plotNumber','gateLatitude','gateLongitude','nearestTown','alertRadiusKm','bloodType','allergies','chronicConditions','medications','medicalAidName','medicalAidNumber','nearestHospital','doctorName','doctorPhone','language'];
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`"${key}"=$${i++}`);
        values.push(req.body[key]);
      }
    }
    if (!updates.length) { res.status(400).json({ success: false, message: 'No valid fields' }); return; }
    updates.push(`"updatedAt"=NOW()`);
    values.push(req.user!.id);
    const result = await pool.query(`UPDATE users SET ${updates.join(',')} WHERE id=$${i} RETURNING id,email,name,"farmName",role,status,tier,language,"plotNumber","gateLatitude","gateLongitude","nearestTown","alertRadiusKm","bloodType",allergies,"chronicConditions",medications,"medicalAidName","medicalAidNumber","nearestHospital","doctorName","doctorPhone"`, values);
    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default authRouter;
