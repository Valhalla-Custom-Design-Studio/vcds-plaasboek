import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import * as Sentry from '@sentry/node';

// ─── Sentry v8 Error Monitoring ────────────────────────────
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: 'plaasboek@' + (process.env.npm_package_version || '1.0.0'),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  integrations: [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
  ],
});
// ───────────────────────────────────────────────────────────






// ─── Prevent crash on unhandled rejections ───
process.on('unhandledRejection', (reason) => {
  console.error('[VCDS-VEEKOS] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[VCDS-VEEKOS] Uncaught Exception:', err.message);
});

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '*').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));

app.get(`/api/${API_VERSION}/health`, (_req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy', 
    service: 'vcds-plaasboek',
    timestamp: new Date().toISOString() 
  });
});

app.get('/', (_req, res) => {
  res.json({ service: 'Plaasboek API', version: API_VERSION, status: 'online' });
});

const server =
app.listen(PORT, () => {
  console.log(`[VCDS-VEEKOS] API running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('[VCDS-VEEKOS] Server error:', err);
});

export default app;
