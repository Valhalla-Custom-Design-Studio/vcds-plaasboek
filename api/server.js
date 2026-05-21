const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.APP_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Payfast ITN

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

// Health check
app.get('/health', (req, res) => res.json({
  status: 'ok',
  app: 'vcds-plaasboek',
  version: '0.1.0',
  env: process.env.NODE_ENV
}));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`vcds-plaasboek API running on port ${PORT} [${process.env.NODE_ENV}]`));
module.exports = app;
