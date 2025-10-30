const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const app = express();

// ✅ Load Groq API key from environment variable
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not found in environment variables!");
  console.log("💡 Please set GROQ_API_KEY in your .env file");
  process.exit(1);
}

console.log("🔐 Loaded Groq API Key:", GROQ_API_KEY.slice(0, 10) + '...');
console.log("✅ API Key length:", GROQ_API_KEY.length, "characters");

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
const attendanceRoutes = require('./routes/attendanceRoutes');
const lossOfSaleRoutes = require('./routes/lossOfSaleRoutes');
app.use('/api', dsrRoutes);
app.use('/api', promptRoutes);
app.use('/api', dailyResponseRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', lossOfSaleRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ DSR Analysis Server running at http://localhost:${PORT}`);
  console.log(`📊 Ready to analyze DSR sheets`);
});