import { Router, Response, Request } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendSMS, buildSOSMessage, buildStandDownMessage } from '../services/BulkSMSService';
import { Expo } from 'expo-server-sdk';

const router = Router();
const expo = new Expo();

// Helper: send push notifications to nearby farmers
async function notifyNearbyFarmers(
  senderId: string, lat: number, lng: number, radiusKm: number,
  sosType: string, farmName: string, eventId: string
): Promise<number> {
  try {
    const typeEmoji: Record<string, string> = { attack: '🚨', medical: '🚑', fire: '🔥', general: '🆘' };
    const typeLabel: Record<string, { en: string; af: string }> = {
      attack: { en: 'FARM ATTACK EMERGENCY', af: 'PLAASAANVAL NOODGEVAL' },
      medical: { en: 'MEDICAL EMERGENCY', af: 'MEDIESE NOODGEVAL' },
      fire: { en: 'FIRE EMERGENCY', af: 'BRAND NOODGEVAL' },
      general: { en: 'EMERGENCY', af: 'NOODGEVAL' },
    };
    // Find nearby approved farmers with push tokens
    const nearby = await pool.query(
      `SELECT DISTINCT pt.token, u.language FROM push_tokens pt
       JOIN users u ON u.id=pt.user_id
       WHERE u.id != $1 AND u.status='approved'
       AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
       AND (6371 * acos(cos(radians($2)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians($3)) + sin(radians($2)) * sin(radians(u.latitude)))) < $4`,
      [senderId, lat, lng, radiusKm]
    );
    const messages = nearby.rows
      .filter((r: any) => Expo.isExpoPushToken(r.token))
      .map((r: any) => {
        const lang = r.language === 'af' ? 'af' : 'en';
        const label = typeLabel[sosType]?.[lang] || typeLabel.general[lang];
        return {
          to: r.token,
          title: `${typeEmoji[sosType] || '🆘'} ${label}`,
          body: `${farmName} needs emergency help!`,
          data: { eventId, sosType, screen: 'emergencies/event/' + eventId },
          sound: 'default',
          priority: 'high',
        };
      });
    if (messages.length === 0) return 0;
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    return messages.length;
  } catch (err) {
    console.error('[SOS] Push notification error:', err);
    return 0;
  }
}

// POST /api/sos — Trigger SOS
const sosRateLimit = new Map<string, number>();
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, sosType = 'general' } = req.body;
    if (!latitude || !longitude) {
      res.status(400).json({ success: false, message: 'latitude and longitude required' }); return;
    }
    // Rate limit: 30s between triggers
    const lastTrigger = sosRateLimit.get(req.user!.id);
    if (lastTrigger && Date.now() - lastTrigger < 30000) {
      res.status(429).json({ success: false, message: 'SOS rate limited — wait 30 seconds' }); return;
    }
    sosRateLimit.set(req.user!.id, Date.now());

    const userResult = await pool.query(
      `SELECT name, farm_name, plot_number, gate_latitude, gate_longitude, alert_radius_km,
              blood_type, allergies, medical_aid_name, language
       FROM users WHERE id=$1`,
      [req.user!.id]
    );
    const user = userResult.rows[0];
    const farmName = user.farm_name || user.name;
    const radiusKm = user.alert_radius_km || 10;

    // Create SOS event
    const event = await pool.query(
      `INSERT INTO sos_events (sender_id, farm_name, sos_type, latitude, longitude, timestamp)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [req.user!.id, farmName, sosType, latitude, longitude]
    );
    const eventId = event.rows[0].id;

    // Layer 1: Push notifications
    const notifiedCount = await notifyNearbyFarmers(
      req.user!.id, latitude, longitude, radiusKm, sosType, farmName, eventId
    );

    // Layer 3: BulkSMS to emergency contacts
    const contacts = await pool.query(
      'SELECT phone FROM emergency_contacts WHERE user_id=$1 ORDER BY priority DESC',
      [req.user!.id]
    );
    const phones = contacts.rows.map((c: any) => c.phone);
    let smsCount = 0;
    if (phones.length > 0) {
      const lang = user.language === 'af' ? 'af' : 'en';
      const msg = buildSOSMessage(lang, sosType, {
        farmerName: user.name,
        farmName,
        plotNumber: user.plot_number,
        lat: latitude,
        lng: longitude,
        gateLat: user.gate_latitude,
        gateLng: user.gate_longitude,
        timestamp: new Date().toLocaleString('af-ZA'),
        bloodType: user.blood_type,
        allergies: user.allergies,
        medicalAid: user.medical_aid_name,
      });
      smsCount = await sendSMS(phones, msg);
    }

    // Update counts
    await pool.query(
      'UPDATE sos_events SET notified_count=$1, sms_count=$2 WHERE id=$3',
      [notifiedCount, smsCount, eventId]
    );

    res.status(201).json({ success: true, eventId, notifiedCount, smsCount });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/sos
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'sent', resolved, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = type === 'sent' ? ['se.sender_id=$1'] : [
      `se.id IN (SELECT sos_event_id FROM sos_acknowledgements WHERE user_id=$1)`
    ];
    const values: any[] = [req.user!.id];
    let idx = 2;
    if (resolved !== undefined) { conditions.push(`se.resolved=$${idx++}`); values.push(resolved === 'true'); }
    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT se.*, u.name as sender_name FROM sos_events se
       JOIN users u ON u.id=se.sender_id
       WHERE ${where} ORDER BY se.timestamp DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, parseInt(limit), offset]
    );
    res.json({ success: true, items: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/sos/dms/status
router.get('/dms/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM dead_mans_switches WHERE user_id=$1', [req.user!.id]);
    res.json({ success: true, dms: result.rows[0] || null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/sos/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT se.*, u.name as sender_name, u.farm_name, u.plot_number, u.gate_latitude, u.gate_longitude
       FROM sos_events se JOIN users u ON u.id=se.sender_id WHERE se.id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const acks = await pool.query(
      'SELECT sa.*, u.name FROM sos_acknowledgements sa JOIN users u ON u.id=sa.user_id WHERE sa.sos_event_id=$1',
      [req.params.id]
    );
    res.json({ success: true, item: { ...result.rows[0], acknowledgements: acks.rows } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/:id/acknowledge
router.post('/:id/acknowledge', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'INSERT INTO sos_acknowledgements (sos_event_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user!.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/:id/stand-down
router.post('/:id/stand-down', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const event = await pool.query('SELECT * FROM sos_events WHERE id=$1', [req.params.id]);
    if (!event.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (event.rows[0].sender_id !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Only the sender can stand down' }); return;
    }
    if (event.rows[0].cancelled_by_sender) {
      res.json({ success: true, alreadyCancelled: true }); return;
    }
    await pool.query(
      'UPDATE sos_events SET cancelled_by_sender=true, resolved=true, resolved_by=$1, resolved_at=NOW() WHERE id=$2',
      [req.user!.id, req.params.id]
    );
    // Notify nearby farmers of stand-down
    const userResult = await pool.query('SELECT name, farm_name, language FROM users WHERE id=$1', [req.user!.id]);
    const user = userResult.rows[0];
    const lang = user.language === 'af' ? 'af' : 'en';
    const msg = buildStandDownMessage(lang, user.name, user.farm_name || user.name);
    const contacts = await pool.query('SELECT phone FROM emergency_contacts WHERE user_id=$1', [req.user!.id]);
    const phones = contacts.rows.map((c: any) => c.phone);
    if (phones.length > 0) await sendSMS(phones, msg);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/dead-mans-switch
router.post('/dead-mans-switch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { armed, enabled, intervalMinutes } = req.body;
    const result = await pool.query(
      `INSERT INTO dead_mans_switches (user_id, armed, enabled, interval_minutes, timeout_minutes, armed_at)
       VALUES ($1, $2, $3, $4, $4, CASE WHEN $2 THEN NOW() ELSE NULL END)
       ON CONFLICT (user_id) DO UPDATE SET
         armed=$2, enabled=$3, interval_minutes=COALESCE($4, dead_mans_switches.interval_minutes),
         timeout_minutes=COALESCE($4, dead_mans_switches.timeout_minutes),
         armed_at=CASE WHEN $2 AND NOT dead_mans_switches.armed THEN NOW() ELSE dead_mans_switches.armed_at END,
         updated_at=NOW()
       RETURNING *`,
      [req.user!.id, armed ?? false, enabled ?? false, intervalMinutes || 60]
    );
    res.json({ success: true, dms: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/heartbeat
router.post('/heartbeat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    await pool.query(
      `UPDATE dead_mans_switches SET last_heartbeat=NOW(), latitude=$2, longitude=$3, updated_at=NOW()
       WHERE user_id=$1`,
      [req.user!.id, latitude || null, longitude || null]
    );
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/test-sms
router.post('/test-sms', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) { res.status(400).json({ success: false, message: 'phone required' }); return; }
    const msg = 'This is a test message from Plaasboek. Your contact has added you as an emergency contact.';
    const sent = await sendSMS(phone, msg);
    res.json({ success: sent > 0, message: sent > 0 ? 'Test SMS sent' : 'Test SMS failed' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/check-expired-switches — CRON endpoint
router.post('/check-expired-switches', async (req: Request, res: Response) => {
  try {
    const secret = req.headers['x-cron-secret'];
    if (secret !== process.env.CRON_SECRET) {
      res.status(401).json({ success: false, message: 'Unauthorized' }); return;
    }
    const expired = await pool.query(
      `SELECT dms.*, u.name, u.farm_name, u.language, u.plot_number, u.gate_latitude, u.gate_longitude,
              u.blood_type, u.allergies, u.medical_aid_name
       FROM dead_mans_switches dms
       JOIN users u ON u.id=dms.user_id
       WHERE dms.armed=true AND dms.enabled=true AND dms.fired_at IS NULL
       AND dms.last_heartbeat < NOW() - (dms.timeout_minutes || ' minutes')::INTERVAL`
    );
    let fired = 0;
    for (const dms of expired.rows) {
      const lat = dms.latitude || 0;
      const lng = dms.longitude || 0;
      const farmName = dms.farm_name || dms.name;
      const lang = dms.language === 'af' ? 'af' : 'en';
      // Fire SOS
      const event = await pool.query(
        `INSERT INTO sos_events (sender_id, farm_name, sos_type, latitude, longitude, timestamp)
         VALUES ($1,$2,'attack',$3,$4,NOW()) RETURNING id`,
        [dms.user_id, farmName, lat, lng]
      );
      const eventId = event.rows[0].id;
      // Send SMS
      const contacts = await pool.query('SELECT phone FROM emergency_contacts WHERE user_id=$1', [dms.user_id]);
      const phones = contacts.rows.map((c: any) => c.phone);
      if (phones.length > 0) {
        const msg = buildSOSMessage(lang, 'attack', {
          farmerName: dms.name, farmName, plotNumber: dms.plot_number,
          lat, lng, gateLat: dms.gate_latitude, gateLng: dms.gate_longitude,
          timestamp: new Date().toLocaleString('af-ZA'),
          bloodType: dms.blood_type, allergies: dms.allergies, medicalAid: dms.medical_aid_name,
        });
        await sendSMS(phones, msg);
      }
      // Mark as fired and disarm
      await pool.query(
        'UPDATE dead_mans_switches SET fired_at=NOW(), armed=false, updated_at=NOW() WHERE user_id=$1',
        [dms.user_id]
      );
      fired++;
    }
    res.json({ success: true, checked: expired.rows.length, fired });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
