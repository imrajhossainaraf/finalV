/**
 * ============================================================
 *  ATTENDLY LOCAL EMAIL SERVICE v1.5 (MVC RESTRUCTURED)
 *  Processes email notifications locally for better speed.
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use('/api', apiRoutes);

// Root health check
app.get('/', (req, res) => {
  res.json({ service: 'Attendly Local Email Service', status: 'running', version: '1.5-MVC' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Local Email Service running on http://localhost:${PORT}`);
});
