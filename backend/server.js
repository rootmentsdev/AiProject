const express = require('express');
const cors = require('cors');

const app = express();

// ✅ Set API key directly in server.js (no .env file needed)
const OPENROUTER_API_KEY = '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';
process.env.OPENROUTER_API_KEY = OPENROUTER_API_KEY;

console.log("🔐 Loaded API Key:", OPENROUTER_API_KEY.slice(0, 10) + '...');
console.log("✅ API Key length:", OPENROUTER_API_KEY.length, "characters");

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Routes
const dsrRoutes = require('./routes/dsrRoutes');
app.use('/api', dsrRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ DSR Analysis Server running at http://localhost:${PORT}`);
  console.log(`📊 Ready to analyze DSR sheets`);
});