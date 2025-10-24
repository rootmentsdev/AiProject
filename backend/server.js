const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ✅ Set API key directly in server.js (no .env file needed)
const OPENROUTER_API_KEY = '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';
process.env.OPENROUTER_API_KEY = OPENROUTER_API_KEY;

console.log("🔐 Loaded API Key:", OPENROUTER_API_KEY.slice(0, 10) + '...');
console.log("✅ API Key length:", OPENROUTER_API_KEY.length, "characters");

// ✅ MongoDB connection string with database name
const MONGODB_URI = 'mongodb+srv://abhiramskumar75_db_user:root@cluster0.bg40zfa.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
process.env.MONGODB_URI = MONGODB_URI;

console.log("🔐 MongoDB URI set successfully");

// ✅ Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log("✅ MongoDB connected successfully to dsrAnalysisDB");
  console.log("✅ Database ready for operations");
  // Save the DSR prompt to database on startup
  const savePromptOnStartup = require('./utils/savePrompt');
  savePromptOnStartup();
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  console.error("❌ Please check your MongoDB credentials and network connection");
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
const dsrRoutes = require('./routes/dsrRoutes');
const promptRoutes = require('./routes/promptRoutes');
const dailyResponseRoutes = require('./routes/dailyResponseRoutes');
const integratedAnalysisRoutes = require('./routes/integratedAnalysisRoutes');
app.use('/api', dsrRoutes);
app.use('/api', promptRoutes);
app.use('/api', dailyResponseRoutes);
app.use('/api', integratedAnalysisRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ DSR Analysis Server running at http://localhost:${PORT}`);
  console.log(`📊 Ready to analyze DSR sheets`);
});