import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db/pool';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Routes
import authRouter from './routes/auth';
import journalRouter from './routes/journal';
import rainfallRouter from './routes/rainfall';
import livestockRouter from './routes/livestock';
import expensesRouter from './routes/expenses';
import workersRouter from './routes/workers';
import emergencyContactsRouter from './routes/emergencyContacts';
import sosRouter from './routes/sos';
import paymentsRouter from './routes/payments';
import subscriptionRouter from './routes/subscriptions';
import uploadRouter from './routes/upload';
import pushTokensRouter from './routes/pushTokens';
import syncRouter from './routes/sync';
import adminRouter from './routes/admin';
import recordsRouter from './routes/records';
import healthRouter from './routes/health';
import watchlistRouter from './routes/watchlist';

// Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'production' });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

// Body parsing — raw for PayFast webhook
app.use('/api/payments/notify', express.raw({ type: 'application/x-www-form-urlencoded' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Routes
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/journal', journalRouter);
app.use('/api/rainfall', rainfallRouter);
app.use('/api/livestock', livestockRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/workers', workersRouter);
app.use('/api/emergency-contacts', emergencyContactsRouter);
app.use('/api/sos', sosRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/push-tokens', pushTokensRouter);
app.use('/api/sync', syncRouter);
app.use('/api/admin', adminRouter);
app.use('/api/records', recordsRouter);

// Dead Man Switch cron — runs every 5 minutes
setInterval(async () => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.name, u.id as uid FROM dead_mans_switches d
      JOIN users u ON u.id = d.user_id
      WHERE d.is_armed = true AND d.status = 'armed' AND d.trigger_at <= NOW()
    `);
    for (const dms of result.rows) {
      await pool.query('UPDATE dead_mans_switches SET status=$1, "updatedAt"=NOW() WHERE id=$2', ['triggered', dms.id]);
      // Trigger SOS
      await pool.query(
        "INSERT INTO sos_events (user_id, trigger_type, message, status) VALUES ($1,'dms','Dead Man Switch triggered — no heartbeat received','active')",
        [dms.uid]
      );
}
  } catch (err) {
    console.error('DMS cron error:', err);
  }
}, 5 * 60 * 1000);

// Error handler
app.use('/api/watchlist', watchlistRouter);

app.use(errorHandler);

app.listen(PORT, () => {
});

export default app;
