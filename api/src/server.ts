import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: 'plaasboek@' + (process.env.npm_package_version || '1.0.0'),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
});

process.on('unhandledRejection', (reason) => { console.error('[PLAASBOEK] Unhandled Rejection:', reason); });
process.on('uncaughtException', (err) => { console.error('[PLAASBOEK] Uncaught Exception:', err.message); });

import authRouter from './routes/auth';
import recordsRouter from './routes/records';
import livestockRouter from './routes/livestock';
import workersRouter from './routes/workers';
import paymentsRouter from './routes/payments';
import subscriptionsRouter from './routes/subscriptions';
import healthRouter from './routes/health';

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';
const BASE = `/api/${API_VERSION}`;

app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '*').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));

app.use(`${BASE}/health`, healthRouter);
app.use(`${BASE}/auth`, authRouter);
app.use(`${BASE}/records`, recordsRouter);
app.use(`${BASE}/livestock`, livestockRouter);
app.use(`${BASE}/workers`, workersRouter);
app.use(`${BASE}/payments`, paymentsRouter);
app.use(`${BASE}/subscriptions`, subscriptionsRouter);

app.get('/', (_req, res) => { res.json({ service: 'Plaasboek API', version: API_VERSION, status: 'online' }); });

app.use(Sentry.expressErrorHandler());

const server = app.listen(PORT, () => { console.log(`[PLAASBOEK] API running on port ${PORT}`); });
server.on('error', (err) => { console.error('[PLAASBOEK] Server error:', err); });

export default app;
