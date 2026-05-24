import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendBulkSms } from '../services/bulkSms';
import { sendPushNotifications } from '../services/expoPush';

const router = Router();

const SOS_RADIUS: Record<string,number> = { attack: 10, medical: 5, fire: 20, general: 10 };
const SOS_EMOJI: Record<string,string> = { attack: '🚨', medical: '🏥', fire: '🔥', general: '🆘' };

function buildSmsTemplate(user: any, event: any, lang: string): string {
  const lat = event.latitude, lng = event.longitude;
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const gateMaps = user.gateLatitude ? `https://maps.google.com/?q=${user.gateLatitude},${user.gateLongitude}` : '';
  const ts = new Date(event.timestamp).toLocaleString('af-ZA');
  if (lang === 'af') {
    if (event.sosType === 'attack') return `🚨 NOODGEVAL: PLAASAANVAL\nNaam: ${user.name}\nPlaas: ${user.farmName||'Onbekend'} (${user.plotNumber||''})\nGPS: ${lat}, ${lng}\n${mapsLink}${gateMaps?`\nHek GPS: ${user.gateLatitude},${user.gateLongitude}\n${gateMaps}`:''}\nTyd: ${ts}\nSTUUR HULP DADELIK\nAntwoord VEILIG om te kanselleer`;
    if (event.sosType === 'medical') return `🏥 MEDIESE NOODGEVAL\nNaam: ${user.name}\nPlaas: ${user.farmName||'Onbekend'}\nGPS: ${lat},${lng}\n${mapsLink}\nTyd: ${ts}\nMEDIESE HULP BENODIG\nBloedgroep: ${user.bloodType||'Onbekend'}\nAllergieë: ${user.allergies||'Geen'}\nMediese fonds: ${user.medicalAidName||'Geen'}\nAntwoord VEILIG om te kanselleer`;
    if (event.sosType === 'fire') return `🔥 BRAND NOODGEVAL\nNaam: ${user.name}\nPlaas: ${user.farmName||'Onbekend'}\nGPS: ${lat},${lng}\n${mapsLink}\nTyd: ${ts}\nBRAND OP PLAAS - HULP BENODIG\nAntwoord VEILIG om te kanselleer`;
    return `🆘 NOODGEVAL\nNaam: ${user.name}\nPlaas: ${user.farmName||'Onbekend'}\nGPS: ${lat},${lng}\n${mapsLink}\nTyd: ${ts}\nSTUUR HULP\nAntwoord VEILIG om te kanselleer`;
  }
  if (event.sosType === 'attack') return `🚨 EMERGENCY: FARM ATTACK\nName: ${user.name}\nFarm: ${user.farmName||'Unknown'} (${user.plotNumber||''})\nGPS: ${lat}, ${lng}\n${mapsLink}${gateMaps?`\nGate GPS: ${user.gateLatitude},${user.gateLongitude}\n${gateMaps}`:''}\nTime: ${ts}\nSEND HELP IMMEDIATELY\nReply SAFE to cancel`;
  if (event.sosType === 'medical') return `🏥 MEDICAL EMERGENCY\nName: ${user.name}\nFarm: ${user.farmName||'Unknown'}\nGPS: ${lat},${lng}\n${mapsLink}\nTime: ${ts}\nMEDICAL HELP NEEDED\nBlood Type: ${user.bloodType||'Unknown'}\nAllergies: ${user.allergies||'None'}\nMedical Aid: ${user.medicalAidName||'None'}\nReply SAFE to cancel`;
  if (event.sosType === 'fire') return `🔥 FIRE EMERGENCY\nName: ${user.name}\nFarm: ${user.farmName||'Unknown'}\nGPS: ${lat},${lng}\n${mapsLink}\nTime: ${ts}\nFIRE ON FARM - HELP NEEDED\nReply SAFE to cancel`;
  return `🆘 EMERGENCY\nName: ${user.name}\nFarm: ${user.farmName||'Unknown'}\nGPS: ${lat},${lng}\n${mapsLink}\nTime: ${ts}\nSEND HELP\nReply SAFE to cancel`;
}

// POST /api/sos — trigger SOS
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, sosType = 'general' } = req.body;
    if (!latitude || !longitude) { res.status(400).json({ success: false, message: 'latitude and longitude required' }); return; }
    const userResult = await pool.query('SELECT * FROM users WHERE id=$1', [req.user!.id]);
    const user = userResult.rows[0];
    const radiusKm = user.alertRadiusKm || SOS_RADIUS[sosType] || 10;
    const eventId = uuidv4();
    const event = { id: eventId, senderId: req.user!.id, farmName: user.farmName||'Unknown', sosType, latitude, longitude, timestamp: new Date() };
    await pool.query(
      `INSERT INTO sos_events (id,"senderId","farmName","sosType",latitude,longitude,timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [eventId, req.user!.id, event.farmName, sosType, latitude, longitude, event.timestamp]
    );
    // Layer 1: Push to nearby approved farmers
    const nearby = await pool.query(
      `SELECT pt.token FROM push_tokens pt JOIN users u ON u.id=pt."userId" WHERE u.status='approved' AND u.id!=$1 AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL AND (6371*acos(cos(radians($2))*cos(radians(u.latitude))*cos(radians(u.longitude)-radians($3))+sin(radians($2))*sin(radians(u.latitude))))<$4`,
      [req.user!.id, latitude, longitude, radiusKm]
    );
    const tokens = nearby.rows.map((r:any) => r.token);
    const emoji = SOS_EMOJI[sosType];
    const pushTitle = `${emoji} ${sosType.toUpperCase()} EMERGENCY`;
    const pushBody = `${event.farmName} needs emergency help!`;
    const notifiedCount = await sendPushNotifications(tokens, pushTitle, pushBody, { eventId, sosType });
    // Layer 3: BulkSMS to emergency contacts
    const contacts = await pool.query('SELECT phone FROM emergency_contacts WHERE "userId"=$1', [req.user!.id]);
    const phones = contacts.rows.map((r:any) => r.phone);
    const smsBody = buildSmsTemplate(user, event, user.language||'af');
    const smsCount = await sendBulkSms(phones, smsBody);
    await pool.query(`UPDATE sos_events SET "notifiedCount"=$1,"smsCount"=$2 WHERE id=$3`, [notifiedCount, smsCount, eventId]);
    res.status(201).json({ success: true, eventId, notifiedCount, smsCount });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/sos
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type = 'sent', resolved, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page)-1)*parseInt(limit);
    let q = `SELECT se.*, u.name as "senderName", u."farmName" as "senderFarm" FROM sos_events se JOIN users u ON u.id=se."senderId" WHERE `;
    const params: any[] = [req.user!.id]; let i = 2;
    q += type === 'received' ? `se."senderId"!=$1 AND se.latitude IS NOT NULL` : `se."senderId"=$1`;
    if (resolved !== undefined) { q += ` AND se.resolved=$${i++}`; params.push(resolved === 'true'); }
    q += ` ORDER BY se."createdAt" DESC LIMIT $${i++} OFFSET $${i++}`; params.push(parseInt(limit), offset);
    const result = await pool.query(q, params);
    res.json({ success: true, events: result.rows });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/sos/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT se.*, u.name as "senderName", u."farmName" as "senderFarm", u."plotNumber", u."gateLatitude", u."gateLongitude",
       COALESCE(json_agg(sa.*) FILTER (WHERE sa.id IS NOT NULL),'[]') as acknowledgements
       FROM sos_events se JOIN users u ON u.id=se."senderId" LEFT JOIN sos_acknowledgements sa ON sa."sosEventId"=se.id
       WHERE se.id=$1 GROUP BY se.id,u.name,u."farmName",u."plotNumber",u."gateLatitude",u."gateLongitude"`,
      [req.params.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, event: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/:id/acknowledge
router.post('/:id/acknowledge', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO sos_acknowledgements (id,"sosEventId","userId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [uuidv4(), req.params.id, req.user!.id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/:id/stand-down
router.post('/:id/stand-down', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM sos_events WHERE id=$1', [req.params.id]);
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const event = result.rows[0];
    if (event.senderId !== req.user!.id) { res.status(403).json({ success: false, message: 'Only sender can stand down' }); return; }
    if (event.cancelledBySender) { res.json({ success: true, alreadyCancelled: true }); return; }
    await pool.query(`UPDATE sos_events SET "cancelledBySender"=true,resolved=true,"resolvedAt"=NOW(),"resolvedBy"=$1 WHERE id=$2`, [req.user!.id, req.params.id]);
    // Notify via push + SMS
    const userResult = await pool.query('SELECT * FROM users WHERE id=$1', [req.user!.id]);
    const user = userResult.rows[0];
    const tokens = await pool.query(`SELECT pt.token FROM push_tokens pt JOIN users u ON u.id=pt."userId" WHERE u.status='approved' AND u.id!=$1`, [req.user!.id]);
    await sendPushNotifications(tokens.rows.map((r:any)=>r.token), '✅ VEILIG / SAFE', `${user.name} (${user.farmName||''}) het bevestig dat alles veilig is.`, { eventId: req.params.id });
    const contacts = await pool.query('SELECT phone FROM emergency_contacts WHERE "userId"=$1', [req.user!.id]);
    const standDownSms = `✅ VEILIG — Alarm gekanselleer\n${user.name} (${user.farmName||''}) het bevestig dat alles veilig is.\nGeen verdere aksie nodig nie.`;
    await sendBulkSms(contacts.rows.map((r:any)=>r.phone), standDownSms);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/dead-mans-switch
router.post('/dead-mans-switch', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { armed, enabled, intervalMinutes } = req.body;
    const existing = await pool.query('SELECT id FROM dead_mans_switches WHERE "userId"=$1', [req.user!.id]);
    if (existing.rows.length) {
      await pool.query(
        `UPDATE dead_mans_switches SET armed=COALESCE($1,armed),enabled=COALESCE($2,enabled),"intervalMinutes"=COALESCE($3,"intervalMinutes"),"timeoutMinutes"=COALESCE($3,"timeoutMinutes"),"armedAt"=CASE WHEN $1=true THEN NOW() ELSE "armedAt" END,"updatedAt"=NOW() WHERE "userId"=$4`,
        [armed!==undefined?armed:null, enabled!==undefined?enabled:null, intervalMinutes||null, req.user!.id]
      );
    } else {
      await pool.query(
        `INSERT INTO dead_mans_switches (id,"userId",armed,enabled,"intervalMinutes","timeoutMinutes","armedAt") VALUES ($1,$2,$3,$4,$5,$5,$6)`,
        [uuidv4(), req.user!.id, armed||false, enabled||false, intervalMinutes||60, armed?new Date():null]
      );
    }
    const result = await pool.query('SELECT * FROM dead_mans_switches WHERE "userId"=$1', [req.user!.id]);
    res.json({ success: true, dms: result.rows[0] });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/heartbeat
router.post('/heartbeat', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude } = req.body;
    await pool.query(
      `UPDATE dead_mans_switches SET "lastHeartbeat"=NOW(),latitude=COALESCE($1,latitude),longitude=COALESCE($2,longitude),"updatedAt"=NOW() WHERE "userId"=$3`,
      [latitude||null, longitude||null, req.user!.id]
    );
    res.json({ success: true, timestamp: new Date() });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/sos/dms/status
router.get('/dms/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM dead_mans_switches WHERE "userId"=$1', [req.user!.id]);
    res.json({ success: true, dms: result.rows[0] || null });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/test-sms
router.post('/test-sms', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) { res.status(400).json({ success: false, message: 'phone required' }); return; }
    const { sendSms } = await import('../services/bulkSms');
    const ok = await sendSms(phone, 'This is a test message from Plaasboek. Your contact has added you as an emergency contact.');
    res.json({ success: ok, message: ok ? 'Test SMS sent' : 'Test SMS failed' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/sos/check-expired-switches (cron endpoint)
router.post('/check-expired-switches', async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = req.headers['x-cron-secret'];
    if (secret !== process.env.CRON_SECRET) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const expired = await pool.query(
      `SELECT dms.*, u.* FROM dead_mans_switches dms JOIN users u ON u.id=dms."userId" WHERE dms.armed=true AND dms.enabled=true AND dms."firedAt" IS NULL AND dms."lastHeartbeat" < NOW() - (dms."timeoutMinutes" || ' minutes')::INTERVAL`
    );
    let fired = 0;
    for (const row of expired.rows) {
      const eventId = uuidv4();
      const lat = row.latitude || row.latitude_user;
      const lng = row.longitude || row.longitude_user;
      await pool.query(
        `INSERT INTO sos_events (id,"senderId","farmName","sosType",latitude,longitude,timestamp) VALUES ($1,$2,$3,'attack',$4,$5,NOW())`,
        [eventId, row.userId, row.farmName||'Unknown', lat||0, lng||0]
      );
      await pool.query(`UPDATE dead_mans_switches SET "firedAt"=NOW(),armed=false,"updatedAt"=NOW() WHERE "userId"=$1`, [row.userId]);
      const contacts = await pool.query('SELECT phone FROM emergency_contacts WHERE "userId"=$1', [row.userId]);
      const phones = contacts.rows.map((r:any)=>r.phone);
      const smsBody = `🚨 DOOIEMANSSKAKELAAR NOODGEVAL\n${row.name} het nie ingeboek nie.\nPlaas: ${row.farmName||'Onbekend'}\nGPS: ${lat},${lng}\nhttps://maps.google.com/?q=${lat},${lng}\nSTUUR HULP DADELIK`;
      await sendBulkSms(phones, smsBody);
      fired++;
    }
    res.json({ success: true, fired });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
