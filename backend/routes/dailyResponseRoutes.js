const express = require('express');
const router = express.Router();
const dailyResponseController = require('../controllers/dailyResponseController');

// Daily Response Routes
router.get('/daily-responses', dailyResponseController.getAllResponses);
router.get('/daily-responses/latest', dailyResponseController.getLatestResponse);
router.get('/daily-responses/range', dailyResponseController.getResponsesByDateRange);
router.get('/daily-responses/:date', dailyResponseController.getResponseByDate);
router.post('/daily-responses', dailyResponseController.saveResponse);
router.delete('/daily-responses/:id', dailyResponseController.deleteResponse);

module.exports = router;

