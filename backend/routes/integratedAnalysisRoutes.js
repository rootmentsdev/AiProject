const express = require('express');
const router = express.Router();
const integratedAnalysisController = require('../controllers/integratedAnalysisController');

// Integrated analysis routes

/**
 * @route POST /api/integrated-analysis
 * @desc Perform comprehensive analysis combining DSR data with cancellation data
 * @access Public
 * @body {DateFrom, DateTo, LocationID, UserID}
 */
router.post('/integrated-analysis', async (req, res) => {
  try {
    await integratedAnalysisController.performIntegratedAnalysis(req, res);
  } catch (error) {
    console.error("❌ Integrated analysis route error:", error.message);
    res.status(500).json({ 
      error: "Internal server error during integrated analysis" 
    });
  }
});

/**
 * @route POST /api/action-plan
 * @desc Generate AI-powered action plan based on analysis
 * @access Public
 * @body {DateFrom, DateTo, LocationID, UserID}
 */
router.post('/action-plan', async (req, res) => {
  try {
    await integratedAnalysisController.getActionPlan(req, res);
  } catch (error) {
    console.error("❌ Action plan route error:", error.message);
    res.status(500).json({ 
      error: "Internal server error during action plan generation" 
    });
  }
});

/**
 * @route GET /api/cancellation-data
 * @desc Get cancellation data from rental API
 * @access Public
 * @query {DateFrom, DateTo, LocationID, UserID}
 */
router.get('/cancellation-data', async (req, res) => {
  try {
    await integratedAnalysisController.getCancellationData(req, res);
  } catch (error) {
    console.error("❌ Cancellation data route error:", error.message);
    res.status(500).json({ 
      error: "Internal server error during cancellation data fetch" 
    });
  }
});

/**
 * @route GET /api/analysis-status
 * @desc Get analysis system status and health check
 * @access Public
 */
router.get('/analysis-status', async (req, res) => {
  try {
    await integratedAnalysisController.getAnalysisStatus(req, res);
  } catch (error) {
    console.error("❌ Analysis status route error:", error.message);
    res.status(500).json({ 
      error: "Internal server error during status check" 
    });
  }
});

/**
 * @route POST /api/quick-analysis
 * @desc Perform quick analysis with minimal data
 * @access Public
 * @body {DateFrom, DateTo, LocationID, UserID}
 */
router.post('/quick-analysis', async (req, res) => {
  try {
    console.log("🚀 Performing quick analysis...");
    
    const { DateFrom, DateTo, LocationID, UserID } = req.body;
    
      // Get DSR data and extract date
      const dsrModel = require('../models/dsrModel');
      const dsrDataResult = await dsrModel.fetchSheetData();
      const dsrAnalysisService = require('../services/dsrAnalysisService');
      const dsrAnalysis = await dsrAnalysisService.analyzeWithProblemsAndLosses(dsrDataResult);
      
      // Use DSR sheet date for cancellation data
      const { convertDSRDateToDateRange } = require('../utils/dateConverter');
      const dsrSheetDate = dsrDataResult.date || "12/8/2025";
      const cancellationDateRange = convertDSRDateToDateRange(dsrSheetDate);
      
      console.log("📅 Using DSR sheet date for cancellation data:", dsrSheetDate);
      
      // Get cancellation data using DSR date
      const cancellationService = require('../services/cancellationService');
      const cancellationResult = await cancellationService.getCancellationAnalysis(
        cancellationDateRange.DateFrom,
        cancellationDateRange.DateTo,
        LocationID || "0",
        UserID || "7777"
      );

    // Quick comparison
    const comparisonService = require('../services/comparisonService');
    const comparisonResult = await comparisonService.compareDSRLossesWithCancellations(
      dsrAnalysis,
      cancellationResult
    );

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      dsrAnalysis: {
        problemStores: dsrAnalysis?.problemStores?.length || 0,
        totalLoss: dsrAnalysis?.lossAnalysis?.totalLoss || 0,
        description: "Quick analysis completed successfully"
      },
      cancellationAnalysis: {
        totalCancellations: cancellationResult?.analysis?.totalCancellations || 0,
        topReason: cancellationResult?.analysis?.topCancellationReasons?.[0]?.reason || "N/A"
      },
      comparisonAnalysis: {
        correlationFound: comparisonResult?.success || false,
        insights: comparisonResult?.comparison?.integratedInsights?.insights?.length || 0
      }
    });

  } catch (error) {
    console.error("❌ Quick analysis route error:", error.message);
    res.status(500).json({ 
      error: `Quick analysis failed: ${error.message}` 
    });
  }
});

module.exports = router;
