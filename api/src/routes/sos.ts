import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';
import { sendSOSSms } from '../services/bulkSms';
import { sendPushToUsers } from '../services/expoPush';

const sosRouter = Router();
sosRouter.use(authenticate, requireApproved);

const SOS_COOLDOWN_MS = 30 * 1000; // 30 seconds
const lastSosTrigger: Record<string, number> = {};

// Trigger SOS
sosRouter.post('/trigger', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = Date.now();

    // Rate limit: 30s cooldown
    if (lastSosTrigger[userId] && now - lastSosTrigger[userId] < SOS_COOLDOWN_MS) {
      const remaining = Math.ceil((SOS_COOLDOWN_MS - (now - lastSosTrigger[userId])) / 1000);
      res.status(429).json({ success: false, message: `SOS cooldown active. Wait ${remaining}s.` });
      return;
    }
    lastSosTrigger[userId] = now;

    const { trigger_type = 'manual', latitude, longitude, message } = req.body;

    const sosResult = await pool.query(
      `INSERT INTO sos_events (user_id, trigger_type, latitude, longitude, message, status)
       VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`,
      [userId, trigger_type, latitude || null, longitude || null, message || null]
    );
    const sos = sosResult.rows[0];

    // Get farmer name + emergency contacts
    const userResult = await pool.query('SELECT name, "farmName" FROM users WHERE id=$1', [userId]);
    const farmer = userResult.rows[0];
    const contactsResult = await pool.query('SELECT name, phone FROM emergency_contacts WHERE user_id=$1', [userId]);
    const contacts = contactsResult.rows;

    // Layer 1: Push notification to all farmer devices
    await sendPushToUsers([userId], pool, '🚨 SOS AKTIEF`, `${farmer.name} het 'n noodgeval gestuur!`, { sos_id: sos.id });`

    // Layer 2: SMS to emergency contacts
    if (contacts.length) {
      await sendSOSSms(contacts, `${farmer.name} (${farmer.farmName || 'Plaas'})`, latitude, longitude);
    }

    // Layer 3: Push to all admin users
    const adminResult = await pool.query("SELECT id FROM users WHERE role='admin'");
    const adminIds = adminResult.rows.map((r: any) => r.id);
    if (adminIds.length) {
      await sendPushToUsers(adminIds, pool, '🚨 SOS ALERT', `${farmer.name} triggered SOS on ${farmer.farmName}`, { sos_id: sos.id });
    }

    res.status(201).json({ success: true, sos });
  } catch (err) {
    console.error('SOS trigger error:', err);
    res.status(500).json({ success: false, message: 'SOS trigger failed' });
  }
});

// List SOS events
sosRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM sos_events WHERE user_id=$1 ORDER BY "createdAt" DESC LIMIT 50',
      [req.user!.id]
    );
    res.json({ success: true, events: result.rows });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch SOS events' }); }
});

// Acknowledge SOS
sosRouter.post('/:id/acknowledge', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { responder_name, responder_phone } = req.body;
    await pool.query('UPDATE sos_events SET status=$1, "updatedAt"=NOW() WHERE id=$2', ['acknowledged', id]);
    await pool.query(
      'INSERT INTO sos_acknowledgements (sos_id, responder_id, responder_name, responder_phone) VALUES ($1,$2,$3,$4)',
      [id, req.user!.id, responder_name || req.user!.email, responder_phone || null]
    );
    res.json({ success: true, message: 'SOS acknowledged' });
  } catch { res.status(500).json({ success: false, message: 'Acknowledge failed' }); }
});

// Stand down SOS
sosRouter.post('/:id/stand-down', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE sos_events SET status=$1, "updatedAt"=NOW() WHERE id=$2 AND user_id=$3',
      ['stood_down', id, req.user!.id]
    );
    res.json({ success: true, message: 'SOS stood down' });
  } catch { res.status(500).json({ success: false, message: 'Stand down failed' }); }
});

// Get single SOS event
sosRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT s.*, json_agg(a.*) as acknowledgements FROM sos_events s LEFT JOIN sos_acknowledgements a ON a.sos_id=s.id WHERE s.id=$1 GROUP BY s.id',
      [req.params.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, event: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch SOS event' }); }
});

export default sosRouter;
