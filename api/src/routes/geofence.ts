import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../db/pool';
import { sendPushNotification } from '../services/fcm.service';

const router = Router();

/**
 * POST /api/geofence
 * Create a geofence zone around a farm or asset
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, lat, lng, radiusMeters, type } = req.body;
    if (!name || !lat || !lng || !radiusMeters) {
      return res.status(400).json({ error: 'name, lat, lng, and radiusMeters are required' });
    }
    const result = await pool.query(
      `INSERT INTO geofences (user_id, name, lat, lng, radius_meters, type, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING *`,
      [userId, name, lat, lng, radiusMeters, type || 'farm']
    );
    return res.status(201).json({ success: true, geofence: result.rows[0] });
  } catch (err: any) {
    console.error('[Geofence] create error:', err.message);
    return res.status(500).json({ error: 'Failed to create geofence' });
  }
});

/**
 * GET /api/geofence
 * List all geofences for current user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM geofences WHERE user_id = $1 AND active = true ORDER BY created_at DESC',
      [req.user!.userId]
    );
    return res.json({ success: true, geofences: result.rows });
  } catch (err: any) {
    console.error('[Geofence] list error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch geofences' });
  }
});

/**
 * POST /api/geofence/breach
 * Report a geofence breach (vehicle/person crossed boundary)
 * Triggers SOS-level push to emergency contacts
 */
router.post('/breach', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { geofenceId, breachType, lat, lng, vehiclePlate, description } = req.body;

    if (!geofenceId || !breachType) {
      return res.status(400).json({ error: 'geofenceId and breachType are required' });
    }

    // Log the breach
    const breach = await pool.query(
      `INSERT INTO geofence_breaches (geofence_id, user_id, breach_type, lat, lng, vehicle_plate, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [geofenceId, userId, breachType, lat, lng, vehiclePlate || null, description || null]
    );

    // Get the geofence name
    const gf = await pool.query('SELECT name FROM geofences WHERE id = $1', [geofenceId]);
    const geofenceName = gf.rows[0]?.name || 'Unknown Zone';

    // Alert emergency contacts
    const contacts = await pool.query(
      'SELECT push_token FROM emergency_contacts WHERE user_id = $1 AND push_token IS NOT NULL',
      [userId]
    );

    let notified = 0;
    for (const contact of contacts.rows) {
      if (contact.push_token) {
        await sendPushNotification(
          contact.push_token, null,
          `🚨 Geofence Breach — ${geofenceName}`,
          `${breachType} detected${vehiclePlate ? ` — Plate: ${vehiclePlate}` : ''}. Check your farm immediately.`,
          { type: 'GEOFENCE_BREACH', geofenceId, breachType }
        ).catch(() => {});
        notified++;
      }
    }

    return res.status(201).json({ success: true, breach: breach.rows[0], notified });
  } catch (err: any) {
    console.error('[Geofence] breach error:', err.message);
    return res.status(500).json({ error: 'Failed to log geofence breach' });
  }
});

/**
 * DELETE /api/geofence/:id
 * Deactivate a geofence
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE geofences SET active = false WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    );
    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Geofence] delete error:', err.message);
    return res.status(500).json({ error: 'Failed to delete geofence' });
  }
});

export default router;
