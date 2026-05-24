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
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

import authRouter from './routes/auth';
import journalRouter from './routes/journal';
import rainfallRouter from './routes/rainfall';
import livestockRouter from './routes/livestock';
import expensesRouter from './routes/expenses';
import workersRouter from './routes/workers';
import vetVisitsRouter from './routes/vetVisits';
import emergencyContactsRouter from './routes/emergencyContacts';
import sosRouter from './routes/sos';
import adminRouter from './routes/admin';
import pushTokensRouter from './routes/pushTokens';
import uploadRouter from './routes/upload';
import syncRouter from './routes/sync';
import paymentsRouter from './routes/payments';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();

app.use(Sentry.Handlers.requestHandler());
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'plaasboek-api', timestamp: new Date().toISOString() }));

// Routes
app.post('/api/signup', authRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', authRouter);
app.use('/api/journal', journalRouter);
app.use('/api/rainfall', rainfallRouter);
app.use('/api/camps', livestockRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/workers', workersRouter);
app.use('/api/vet-visits', vetVisitsRouter);
app.use('/api/emergency-contacts', emergencyContactsRouter);
app.use('/api/sos', sosRouter);
app.use('/api/admin', adminRouter);
app.use('/api/push-tokens', pushTokensRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/sync', syncRouter);
app.use('/api/payments', paymentsRouter);

app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Plaasboek API] Running on port ${PORT} — ${process.env.NODE_ENV || 'development'}`);
});

export default app;
