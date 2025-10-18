const express = require('express');
const router = express.Router();
const dsrController = require('../controllers/dsrController');

// DSR Analysis Routes - No parameters needed, uses hardcoded sheet
router.get('/analyze-sheet', dsrController.analyzeSheet);

module.exports = router;
