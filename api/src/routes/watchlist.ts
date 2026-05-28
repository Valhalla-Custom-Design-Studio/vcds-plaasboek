import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router();
const WATCHLIST_ENGINE_URL = process.env.WATCHLIST_ENGINE_URL || 'http://localhost:3100';

// ── Proxy helpers ──────────────────────────────────────────────────────────────
async function engineGet(path: string) {
  const res = await fetch(`${WATCHLIST_ENGINE_URL}${path}`, {
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN || '' },
  });
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

async function enginePost(path: string, body: unknown) {
  const res = await fetch(`${WATCHLIST_ENGINE_URL}${path}`, {
    method: 'POST',
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN || '', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

async function engineDelete(path: string) {
  const res = await fetch(`${WATCHLIST_ENGINE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN || '' },
  });
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

// ── Admin guard ───────────────────────────────────────────────────────────────
async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = (req as any).user?.id || (req as any).userId;
  if (!userId) { res.status(401).json({ error: 'Unauthenticated' }); return; }
  const { rows } = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (!rows[0] || !['admin', 'moderator'].includes(rows[0].role)) {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  next();
}

// ── PLATES ────────────────────────────────────────────────────────────────────
router.get('/plates', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await engineGet('/api/v1/watchlist/plates');
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/plates', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await enginePost('/api/v1/watchlist/plates', {
      ...req.body,
      added_by_app: 'plaasboek',
      added_by_user_id: (req as any).user?.id || (req as any).userId,
    });
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/plates/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await engineDelete(`/api/v1/watchlist/plates/${req.params.id}`);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── FACES ─────────────────────────────────────────────────────────────────────
router.get('/faces', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await engineGet('/api/v1/watchlist/faces');
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/faces', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await enginePost('/api/v1/watchlist/faces', {
      ...req.body,
      added_by_app: 'plaasboek',
      added_by_user_id: (req as any).user?.id || (req as any).userId,
    });
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/faces/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await engineDelete(`/api/v1/watchlist/faces/${req.params.id}`);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── CAMERAS ───────────────────────────────────────────────────────────────────
router.get('/cameras', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await engineGet('/api/v1/cameras');
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/cameras', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await enginePost('/api/v1/cameras', { ...req.body, app_context: 'plaasboek' });
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/cameras/:id/ping', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await enginePost(`/api/v1/cameras/${req.params.id}/ping`, {});
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/cameras/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await engineDelete(`/api/v1/cameras/${req.params.id}`);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── EVENTS (read-only log) ────────────────────────────────────────────────────
router.get('/events', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit || 50;
    const watchlist_only = req.query.watchlist_only || 'false';
    const data = await engineGet(`/api/v1/watchlist/events?limit=${limit}&watchlist_only=${watchlist_only}`);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── ALERT WEBHOOK (engine → app) — no auth, use secret ────────────────────────
router.post('/alert-webhook', async (req: Request, res: Response) => {
  try {
    const secret = req.headers['x-internal-token'];
    if (secret !== process.env.INTERNAL_TOKEN) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { event, plate_number, threat_level, camera_id, timestamp } = req.body;
    console.log(`[Watchlist Alert] ${event}: ${plate_number} | Threat: ${threat_level} | Camera: ${camera_id} | ${timestamp}`);
    // Wire Expo push notifications to registered app users
    try {
      const tokenRows = await pool.query('SELECT push_token FROM push_tokens WHERE push_token IS NOT NULL');
      const { Expo } = require('expo-server-sdk');
      const expo = new Expo();
      const messages = tokenRows.rows
        .filter((r: any) => Expo.isExpoPushToken(r.push_token))
        .map((r: any) => ({
          to: r.push_token,
          sound: 'default',
          title: `🚨 Waglyswaarskuwing: ${event}`,
          body: `Nommerbord ${plate_number} | Dreigingsvlak: ${threat_level}`,
          data: { event, plate_number, threat_level, camera_id, timestamp },
        }));
      if (messages.length > 0) {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk).catch((e: any) => console.error('[Expo push error]', e.message));
        }
      }
    } catch (pushErr: any) { console.error('[Push notification error]', pushErr.message); }
    res.json({ success: true, received: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
