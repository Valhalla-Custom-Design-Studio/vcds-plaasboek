const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));

app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Plaasboek™', version: '0.1.0' }));

app.listen(PORT, () => console.log(`Plaasboek™ API on port ${PORT}`));
module.exports = app;
