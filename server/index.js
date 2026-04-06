const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚀 Server is running!' });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express! 🎉' });
});

// ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
