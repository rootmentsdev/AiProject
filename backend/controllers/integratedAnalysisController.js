const dsrAnalysisService = require('../services/dsrAnalysisService');
const cancellationService = require('../services/cancellationService');
const comparisonService = require('../services/comparisonService');
const actionPlanGenerator = require('../services/actionPlanGenerator');
const dsrModel = require('../models/dsrModel');
const DailyResponse = require('../models/dailyResponseModel');
const { convertDSRDateToDateRange } = require('../utils/dateConverter');
const mongoose = require('mongoose');

class IntegratedAnalysisController {
  async performIntegratedAnalysis(req, res) {
    try {
      console.log("🚀 Starting integrated analysis...");
      const startTime = Date.now();

      // Step 1: DSR Data
      const dsrDataResult = await dsrModel.fetchSheetData();
      if (!dsrDataResult || !Array.isArray(dsrDataResult.data) || dsrDataResult.data.length === 0) {
        return res.status(400).json({ error: "No valid DSR data found." });
      }

      const dsrAnalysis = await dsrAnalysisService.analyzeWithProblemsAndLosses(dsrDataResult);
      const dsrSheetDate = dsrDataResult.date || "12/8/2025";
      const cancellationDateRange = convertDSRDateToDateRange(dsrSheetDate);

      // Step 2: Cancellation Data
      const cancellationParams = {
        DateFrom: cancellationDateRange.DateFrom,
        DateTo: cancellationDateRange.DateTo,
        LocationID: req.body.LocationID || "0",
        UserID: req.body.UserID || "7777"
      };
      const cancellationResult = await cancellationService.getCancellationAnalysis(
        cancellationParams.DateFrom,
        cancellationParams.DateTo,
        cancellationParams.LocationID,
        cancellationParams.UserID
      );

      // Step 3: Comparison
      let comparisonResult;
      if (cancellationResult.success) {
        comparisonResult = await comparisonService.compareDSRLossesWithCancellations(
          dsrAnalysis,
          cancellationResult.analysis || {}
        );
      } else {
        comparisonResult = { success: true, comparison: { integratedInsights: { insights: [{ type: "data_unavailable", message: "Cancellation data unavailable" }] } } };
      }

      // Step 4: Action Plan
      const actionPlan = await actionPlanGenerator.generateActionPlan(
        dsrAnalysis,
        cancellationResult.analysis || {},
        comparisonResult.comparison
      );

      // Step 5: Compile Results
      const comprehensiveResults = {
        analysisSummary: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dsrAnalysisSuccess: !!dsrAnalysis,
          cancellationAnalysisSuccess: cancellationResult.success,
          comparisonAnalysisSuccess: comparisonResult.success,
          actionPlanGenerated: !!actionPlan
        },
        dsrAnalysis,
        cancellationAnalysis: cancellationResult,
        comparisonAnalysis: comparisonResult,
        actionPlan,
        quickInsights: this.generateQuickInsights(dsrAnalysis, cancellationResult, comparisonResult),
        recommendations: this.generateTopRecommendations(actionPlan)
      };

      // Step 6: Save to DB
      if (mongoose.connection.readyState === 1) {
        const date = new Date();
        const dailyResponse = new DailyResponse({
          date,
          dateString: date.toISOString().split('T')[0],
          analysisData: comprehensiveResults,
          analysisSummary: {
            type: "integrated_analysis",
            dsrStores: dsrAnalysis?.problemStores?.length || 0,
            cancellations: cancellationResult?.analysis?.totalCancellations || 0,
            totalLoss: dsrAnalysis?.lossAnalysis?.totalLoss || 0
          },
          modelUsed: dsrAnalysisService.lastUsedModel || 'anthropic/claude-3-haiku',
          responseTime: Date.now() - startTime
        });
        await dailyResponse.save();
      }

      res.json(comprehensiveResults);

    } catch (error) {
      console.error("❌ Integrated analysis failed:", error.message);
      res.status(500).json({ error: error.message, timestamp: new Date().toISOString() });
    }
  }

  generateQuickInsights(dsrAnalysis, cancellationAnalysis, comparisonAnalysis) {
    const insights = [];

    if (dsrAnalysis?.problemStores?.length > 0) {
      insights.push({ type: "dsr", message: `${dsrAnalysis.problemStores.length} stores with issues`, severity: "HIGH" });
    }

    if (cancellationAnalysis?.success && cancellationAnalysis?.analysis?.totalCancellations > 0) {
      insights.push({ type: "cancellation", message: `${cancellationAnalysis.analysis.totalCancellations} cancellations`, severity: "MEDIUM" });
    }

    if (comparisonAnalysis?.success && comparisonAnalysis?.comparison?.integratedInsights?.insights?.length > 0) {
      insights.push({ type: "combined", message: `Correlation found between DSR losses and cancellations`, severity: "HIGH" });
    }

    return insights;
  }

  generateTopRecommendations(actionPlan) {
    const recommendations = [];
    if (!actionPlan) return recommendations;

    (actionPlan.immediateActions || []).forEach(a => recommendations.push({ action: a.title, priority: a.priority, timeline: a.timeline, impact: a.expectedImpact }));
    (actionPlan.strategicActions || []).forEach(a => recommendations.push({ action: a.title, priority: "STRATEGIC", timeline: a.timeline, impact: a.expectedImpact }));

    const priorityOrder = { CRITICAL:1, HIGH:2, MEDIUM:3, LOW:4, STRATEGIC:5 };
    return recommendations.sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority]).slice(0,5);
  }
}

module.exports = new IntegratedAnalysisController();
