const express = require('express');
const router = express.Router();
const dsrController = require('../controllers/dsrController');

// DSR Analysis Routes - No parameters needed, uses hardcoded sheet
router.get('/analyze-sheet', dsrController.analyzeSheet);

// Cancellation Data Route
router.get('/cancellation-data', dsrController.getCancellationData);

// Integrated Analysis Route
router.post('/integrated-analysis', dsrController.performIntegratedAnalysis);

module.exports = router;
