const express = require('express');
const router = express.Router();
const lossOfSaleController = require('../controllers/lossOfSaleController');

// Get loss of sale data for DSR date
router.get('/loss-of-sale/dsr-date', lossOfSaleController.getLossOfSaleForDSRDate);

// Get loss of sale data for specific store
router.get('/loss-of-sale/store/:storeName', lossOfSaleController.getLossOfSaleByStore);

// Get all loss of sale data
router.get('/loss-of-sale/all', lossOfSaleController.getAllLossOfSale);

// Get loss of sale summary
router.get('/loss-of-sale/summary', lossOfSaleController.getLossOfSaleSummary);

module.exports = router;

