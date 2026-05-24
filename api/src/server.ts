import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import * as Sentry from '@sentry/node';
import { runMigrations } from './db/migrate';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
});

process.on('unhandledRejection', (reason) => console.error('[PLAASBOEK] Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.error('[PLAASBOEK] Uncaught Exception:', err.message));

import authRouter from './routes/auth';
import paymentsRouter from './routes/payments';
import subscriptionsRouter from './routes/subscriptions';
import healthRouter from './routes/health';
import journalRouter from './routes/journal';
import rainfallRouter from './routes/rainfall';
import livestockRouter from './routes/livestock';
import expensesRouter from './routes/expenses';
import workersRouter from './routes/workers';
import emergencyContactsRouter from './routes/emergencyContacts';
import sosRouter from './routes/sos';
import adminRouter from './routes/admin';
import uploadRouter from './routes/upload';
import pushTokensRouter from './routes/pushTokens';
import syncRouter from './routes/sync';

const app = express();
const PORT = process.env.PORT || 3000;
const API = '/api';

app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '*').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/', (_req, res) => res.json({ service: 'Plaasboek™ API', version: 'v1', status: 'online' }));
app.get('/health', (_req, res) => res.json({ success: true, status: 'healthy', service: 'vcds-plaasboek', timestamp: new Date().toISOString() }));
app.use(`${API}/health`, healthRouter);

// Auth & Profile
app.use(`${API}/signup`, authRouter);
app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, authRouter);

// Core features
app.use(`${API}/journal`, journalRouter);
app.use(`${API}/rainfall`, rainfallRouter);
app.use(`${API}/camps`, livestockRouter);
app.use(`${API}/vet-visits`, livestockRouter);
app.use(`${API}/expenses`, expensesRouter);
app.use(`${API}/workers`, workersRouter);
app.use(`${API}/emergency-contacts`, emergencyContactsRouter);
app.use(`${API}/sos`, sosRouter);
app.use(`${API}/admin`, adminRouter);
app.use(`${API}/upload`, uploadRouter);
app.use(`${API}/files`, uploadRouter);
app.use(`${API}/push-tokens`, pushTokensRouter);
app.use(`${API}/sync`, syncRouter);

// Legacy
app.use(`${API}/payments`, paymentsRouter);
app.use(`${API}/subscriptions`, subscriptionsRouter);

Sentry.setupExpressErrorHandler(app);
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[PLAASBOEK ERROR]', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

async function start() {
  try {
    await runMigrations();
    const server = app.listen(PORT, () => console.log(`[PLAASBOEK] API running on port ${PORT} | ${process.env.NODE_ENV || 'development'}`));
    server.on('error', (err) => console.error('[PLAASBOEK] Server error:', err));
  } catch (err) {
    console.error('[PLAASBOEK] Startup failed:', err);
    process.exit(1);
  }
}

start();
export default app;
