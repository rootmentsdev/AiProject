const express = require('express');
const router = express.Router();
const dsrController = require('../controllers/dsrController');

// DSR Analysis Routes - No parameters needed, uses hardcoded sheet
router.get('/analyze-sheet', dsrController.analyzeSheet);

// Cancellation Data Route
router.get('/cancellation-data', dsrController.getCancellationData);

// Integrated Analysis Route
router.post('/integrated-analysis', dsrController.performIntegratedAnalysis);

// Test route to verify logs
router.get('/test-logs', (req, res) => {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TEST LOG ENDPOINT HIT!');
  console.log('⏰ Time:', new Date().toLocaleString());
  console.log('✅ If you see this, your backend is running the latest code!');
  console.log('='.repeat(80) + '\n');
  res.json({ message: 'Test successful! Check your terminal.' });
});

module.exports = router;
