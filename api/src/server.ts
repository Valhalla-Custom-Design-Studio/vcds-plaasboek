import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.get(`/api/${API_VERSION}/health`, (_req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => console.log(`VCDS API running on port ${PORT}`));
export default app;
