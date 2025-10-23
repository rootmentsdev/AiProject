const express = require('express');
const router = express.Router();
const integratedAnalysisController = require('../controllers/integratedAnalysisController');

router.post('/integrated-analysis', async (req, res) => {
  try { await integratedAnalysisController.performIntegratedAnalysis(req, res); }
  catch (error) { res.status(500).json({ error: "Internal server error during integrated analysis" }); }
});

router.post('/action-plan', async (req, res) => {
  try { await integratedAnalysisController.getActionPlan(req, res); }
  catch (error) { res.status(500).json({ error: "Internal server error during action plan generation" }); }
});

router.get('/cancellation-data', async (req, res) => {
  try { await integratedAnalysisController.getCancellationData(req, res); }
  catch (error) { res.status(500).json({ error: "Internal server error during cancellation data fetch" }); }
});

router.get('/analysis-status', async (req, res) => {
  try { await integratedAnalysisController.getAnalysisStatus(req, res); }
  catch (error) { res.status(500).json({ error: "Internal server error during status check" }); }
});

module.exports = router;
