const express = require('express');
const router = express.Router();
const dsrController = require('../controllers/dsrController');

// DSR Analysis Routes - No parameters needed, uses hardcoded sheet
router.get('/analyze-sheet', dsrController.analyzeSheet);

// Cancellation Data Route
router.get('/cancellation-data', dsrController.getCancellationData);

// Staff Performance Data Route
router.get('/staff-performance-data', async (req, res) => {
  try {
    const { DateFrom, DateTo, LocationID, UserID } = req.query;
    const staffPerformanceService = require('../services/staffPerformanceService');
    const { convertDSRDateToDateRange } = require('../utils/dateConverter');
    const dsrModel = require('../models/dsrModel');
    
    // Use DSR sheet date for staff performance data if no specific date provided
    let staffPerformanceParams;
    if (DateFrom && DateTo) {
      // Use provided dates
      staffPerformanceParams = { DateFrom, DateTo, LocationID: LocationID || "0", UserID: UserID || "7777" };
    } else {
      // Use DSR sheet date
      const dsrDataResult = await dsrModel.fetchSheetData();
      const dsrSheetDate = dsrDataResult.date || "12/8/2025";
      const staffPerformanceDateRange = convertDSRDateToDateRange(dsrSheetDate);
      staffPerformanceParams = {
        DateFrom: staffPerformanceDateRange.DateFrom,
        DateTo: staffPerformanceDateRange.DateTo,
        LocationID: LocationID || "0",
        UserID: UserID || "7777"
      };
      console.log("📅 Using DSR sheet date for staff performance data:", dsrSheetDate);
    }

    const result = await staffPerformanceService.getStaffPerformanceAnalysis(
      staffPerformanceParams.DateFrom,
      staffPerformanceParams.DateTo,
      staffPerformanceParams.LocationID,
      staffPerformanceParams.UserID
    );

    res.json(result);

  } catch (error) {
    console.error("❌ Staff performance data fetch failed:", error.message);
    res.status(500).json({ 
      error: `Staff performance data fetch failed: ${error.message}` 
    });
  }
});

// Integrated Analysis Route (DSR + Cancellation + Staff Performance)
router.post('/integrated-analysis', dsrController.performIntegratedAnalysis);

// Test Staff Performance API
router.get('/test-staff-performance', async (req, res) => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 TESTING STAFF PERFORMANCE API");
    console.log("=".repeat(80));
    
    const staffPerformanceService = require('../services/staffPerformanceService');
    
    // Test with a known date
    const testResult = await staffPerformanceService.getStaffPerformanceAnalysis(
      "2025-8-21",
      "2025-8-21",
      "0",
      "7777"
    );
    
    console.log("\n✅ TEST RESULT:");
    console.log("Success:", testResult.success);
    if (testResult.success && testResult.analysis) {
      const storeCount = Object.keys(testResult.analysis.storeWisePerformance || {}).length;
      console.log("Stores found:", storeCount);
      console.log("Store names:", Object.keys(testResult.analysis.storeWisePerformance || {}).slice(0, 5).join(', '));
    } else {
      console.log("Error:", testResult.error);
    }
    console.log("=".repeat(80) + "\n");
    
    res.json({
      success: testResult.success,
      storeCount: Object.keys(testResult.analysis?.storeWisePerformance || {}).length,
      storeNames: Object.keys(testResult.analysis?.storeWisePerformance || {}).slice(0, 10),
      fullResult: testResult
    });
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
