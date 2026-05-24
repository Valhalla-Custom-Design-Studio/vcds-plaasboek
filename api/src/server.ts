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
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
});

process.on('unhandledRejection', (reason) => console.error('[PLAASBOEK] Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.error('[PLAASBOEK] Uncaught Exception:', err.message));

import authRouter from './routes/auth';
import paymentsRouter from './routes/payments';
import subscriptionsRouter from './routes/subscriptions';
import healthRouter from './routes/health';

const app = express();
const PORT = process.env.PORT || 3000;
const API = '/api/v1';

app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '*').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/', (_req, res) => res.json({ service: 'Plaasboek™ API', version: 'v1', status: 'online' }));
app.get('/health', (_req, res) => res.json({ success: true, status: 'healthy', service: 'vcds-plaasboek', timestamp: new Date().toISOString() }));
app.use(`${API}/health`, healthRouter);

// Routes
app.use(`${API}/auth`, authRouter);
app.use(`${API}/payments`, paymentsRouter);
app.use(`${API}/subscriptions`, subscriptionsRouter);

Sentry.setupExpressErrorHandler(app);
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[PLAASBOEK ERROR]', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

const server = app.listen(PORT, () => console.log(`[PLAASBOEK] API running on port ${PORT}`));
server.on('error', (err) => console.error('[PLAASBOEK] Server error:', err));

export default app;
