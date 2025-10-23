const dsrAnalysisService = require('../services/dsrAnalysisService');
const cancellationService = require('../services/cancellationService');
const comparisonService = require('../services/comparisonService');
const actionPlanGenerator = require('../services/actionPlanGenerator');
const dsrModel = require('../models/dsrModel');
const DailyResponse = require('../models/dailyResponseModel');
const { convertDSRDateToDateRange } = require('../utils/dateConverter');

class IntegratedAnalysisController {
  /**
   * Perform comprehensive analysis combining DSR data with cancellation data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async performIntegratedAnalysis(req, res) {
    try {
      console.log("🚀 Starting integrated DSR and cancellation analysis...");
      
      const startTime = Date.now();
      
      // Step 1: Fetch and analyze DSR data
      console.log("📊 Step 1: Analyzing DSR data...");
      const dsrDataResult = await dsrModel.fetchSheetData();
      
      if (!dsrDataResult || !dsrDataResult.data || dsrDataResult.data.trim() === '') {
        return res.status(400).json({ 
          error: "No valid DSR data found. Please check the Google Sheet content." 
        });
      }

      const dsrAnalysis = await dsrAnalysisService.analyzeWithProblemsAndLosses(dsrDataResult);
      
      // Extract date from DSR sheet and convert to cancellation API format
      const dsrSheetDate = dsrDataResult.date || "12/8/2025"; // Fallback to known date
      const cancellationDateRange = convertDSRDateToDateRange(dsrSheetDate);
      
      console.log("📅 DSR Sheet Date:", dsrSheetDate);
      console.log("📅 Using cancellation date range:", cancellationDateRange);
      
      // Step 2: Fetch cancellation data using DSR sheet date
      console.log("📊 Step 2: Fetching cancellation data for DSR date...");
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

      // Step 3: Compare DSR losses with cancellation data
      console.log("📊 Step 3: Comparing DSR losses with cancellation data...");
      
      let comparisonResult;
      if (cancellationResult.success) {
        comparisonResult = await comparisonService.compareDSRLossesWithCancellations(
          dsrAnalysis,
          cancellationResult
        );
      } else {
        console.log("⚠️ Cancellation API failed, creating fallback comparison analysis...");
        comparisonResult = {
          success: true,
          comparison: {
            correlationAnalysis: {
              correlations: {
                temporalCorrelation: { correlation: "Unknown", findings: ["Cancellation data unavailable"] },
                locationCorrelation: { correlations: [], topCorrelatedLocation: null },
                reasonCorrelation: { correlations: [], primaryReason: null },
                volumeCorrelation: { correlation: "Unknown", insight: "No cancellation data available for correlation analysis" }
              },
              overallCorrelationScore: "Unknown",
              keyFindings: ["Cancellation data unavailable for analysis"]
            },
            patternMatching: {
              patterns: {
                highLossHighCancellation: [],
                seasonalPatterns: { patterns: [], recommendations: [] },
                storeSpecificPatterns: []
              },
              keyPatterns: ["Unable to analyze patterns due to missing cancellation data"]
            },
            impactAssessment: {
              totalDSRLoss: dsrAnalysis.lossAnalysis?.totalLoss || 0,
              totalCancellations: 0,
              estimatedCancellationLoss: 0,
              combinedImpact: dsrAnalysis.lossAnalysis?.totalLoss || 0,
              impactLevel: "Unknown",
              criticalStores: []
            },
            rootCauseAnalysis: {
              rootCauses: {
                primaryCauses: ["Cancellation data unavailable for root cause analysis"],
                secondaryCauses: [],
                systemicIssues: []
              },
              priorityRanking: [],
              recommendedActions: []
            },
            integratedInsights: {
              insights: [
                {
                  type: "data_unavailable",
                  message: "Cancellation data unavailable - analysis based on DSR data only",
                  severity: "MEDIUM",
                  recommendation: "Please check cancellation API connectivity and try again"
                }
              ],
              priorityInsights: [],
              summary: {
                totalInsights: 1,
                highPriorityInsights: 0,
                mediumPriorityInsights: 1,
                requiresImmediateAction: false
              }
            }
          },
          timestamp: new Date().toISOString()
        };
      }

      // Step 4: Generate comprehensive action plan
      console.log("📊 Step 4: Generating AI-powered action plan...");
      const actionPlan = await actionPlanGenerator.generateActionPlan(
        dsrAnalysis,
        cancellationResult,
        comparisonResult.comparison
      );

      // Step 5: Compile comprehensive results
      const comprehensiveResults = {
        analysisSummary: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dsrAnalysisSuccess: !!dsrAnalysis,
          cancellationAnalysisSuccess: cancellationResult.success,
          comparisonAnalysisSuccess: comparisonResult.success,
          actionPlanGenerated: !!actionPlan
        },
        dsrAnalysis: dsrAnalysis,
        cancellationAnalysis: cancellationResult,
        comparisonAnalysis: comparisonResult,
        actionPlan: actionPlan,
        quickInsights: this.generateQuickInsights(dsrAnalysis, cancellationResult, comparisonResult),
        recommendations: this.generateTopRecommendations(actionPlan)
      };

      // Step 6: Save to database
      try {
        const mongoose = require('mongoose');
        
        if (mongoose.connection.readyState === 1) {
          const date = new Date();
          const dateString = date.toISOString().split('T')[0];
          
          const dailyResponse = new DailyResponse({
            date: date,
            dateString: dateString,
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
          console.log(`✅ Saved integrated analysis to MongoDB (${dateString})`);
        }
      } catch (saveError) {
        console.error("❌ Failed to save integrated analysis:", saveError.message);
      }

      console.log("✅ Integrated analysis completed successfully");
      res.json(comprehensiveResults);

    } catch (error) {
      console.error("❌ Integrated analysis failed:", error.message);
      console.error("❌ Error details:", error.stack);
      
      res.status(500).json({ 
        error: `Integrated analysis failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get action plan only (without full analysis)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getActionPlan(req, res) {
    try {
      console.log("🎯 Generating action plan...");
      
      const { DateFrom, DateTo, LocationID, UserID } = req.body;
      
      // Perform quick analysis to get action plan
      const dsrDataResult = await dsrModel.fetchSheetData();
      const dsrAnalysis = await dsrAnalysisService.analyzeWithProblemsAndLosses(dsrDataResult);
      
      // Use DSR sheet date for cancellation data
      const dsrSheetDate = dsrDataResult.date || "12/8/2025";
      const cancellationDateRange = convertDSRDateToDateRange(dsrSheetDate);
      
      const cancellationResult = await cancellationService.getCancellationAnalysis(
        cancellationDateRange.DateFrom,
        cancellationDateRange.DateTo,
        LocationID || "0",
        UserID || "7777"
      );

      const comparisonResult = await comparisonService.compareDSRLossesWithCancellations(
        dsrAnalysis,
        cancellationResult
      );

      const actionPlan = await actionPlanGenerator.generateActionPlan(
        dsrAnalysis,
        cancellationResult,
        comparisonResult.comparison
      );

      res.json({
        success: true,
        actionPlan: actionPlan,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Action plan generation failed:", error.message);
      res.status(500).json({ 
        error: `Action plan generation failed: ${error.message}` 
      });
    }
  }

  /**
   * Get cancellation data only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCancellationData(req, res) {
    try {
      console.log("📊 Fetching cancellation data...");
      
      const { DateFrom, DateTo, LocationID, UserID } = req.query;
      
      // Use DSR sheet date for cancellation data if no specific date provided
      let cancellationParams;
      if (DateFrom && DateTo) {
        // Use provided dates
        cancellationParams = { DateFrom, DateTo, LocationID: LocationID || "0", UserID: UserID || "7777" };
      } else {
        // Use DSR sheet date
        const dsrDataResult = await dsrModel.fetchSheetData();
        const dsrSheetDate = dsrDataResult.date || "12/8/2025";
        const cancellationDateRange = convertDSRDateToDateRange(dsrSheetDate);
        cancellationParams = {
          DateFrom: cancellationDateRange.DateFrom,
          DateTo: cancellationDateRange.DateTo,
          LocationID: LocationID || "0",
          UserID: UserID || "7777"
        };
        console.log("📅 Using DSR sheet date for cancellation data:", dsrSheetDate);
      }

      const result = await cancellationService.getCancellationAnalysis(
        cancellationParams.DateFrom,
        cancellationParams.DateTo,
        cancellationParams.LocationID,
        cancellationParams.UserID
      );

      res.json(result);

    } catch (error) {
      console.error("❌ Cancellation data fetch failed:", error.message);
      res.status(500).json({ 
        error: `Cancellation data fetch failed: ${error.message}` 
      });
    }
  }

  /**
   * Generate quick insights from analysis results
   * @param {Object} dsrAnalysis - DSR analysis results
   * @param {Object} cancellationAnalysis - Cancellation analysis results
   * @param {Object} comparisonAnalysis - Comparison analysis results
   * @returns {Array} Quick insights
   */
  generateQuickInsights(dsrAnalysis, cancellationAnalysis, comparisonAnalysis) {
    const insights = [];

    // DSR insights
    if (dsrAnalysis?.problemStores?.length > 0) {
      insights.push({
        type: "dsr",
        message: `${dsrAnalysis.problemStores.length} stores identified with performance issues`,
        severity: "HIGH",
        impact: "Revenue loss"
      });
    }

    // Cancellation insights
    if (cancellationAnalysis?.success && cancellationAnalysis?.analysis?.totalCancellations > 0) {
      insights.push({
        type: "cancellation",
        message: `${cancellationAnalysis.analysis.totalCancellations} cancellations identified`,
        severity: "MEDIUM",
        impact: "Customer satisfaction"
      });
    }

    // Combined insights
    if (comparisonAnalysis?.success && comparisonAnalysis?.comparison?.integratedInsights) {
      const integratedInsights = comparisonAnalysis.comparison.integratedInsights.insights;
      if (integratedInsights.length > 0) {
        insights.push({
          type: "combined",
          message: `Strong correlation found between DSR losses and cancellations`,
          severity: "HIGH",
          impact: "Business performance"
        });
      }
    }

    return insights;
  }

  /**
   * Generate top recommendations from action plan
   * @param {Object} actionPlan - Action plan results
   * @returns {Array} Top recommendations
   */
  generateTopRecommendations(actionPlan) {
    const recommendations = [];

    if (actionPlan?.immediateActions?.length > 0) {
      actionPlan.immediateActions.forEach(action => {
        recommendations.push({
          action: action.title,
          priority: action.priority,
          timeline: action.timeline,
          impact: action.expectedImpact
        });
      });
    }

    if (actionPlan?.strategicActions?.length > 0) {
      actionPlan.strategicActions.forEach(action => {
        recommendations.push({
          action: action.title,
          priority: "STRATEGIC",
          timeline: action.timeline,
          impact: action.expectedImpact
        });
      });
    }

    // Sort by priority
    const priorityOrder = { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4, "STRATEGIC": 5 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Get analysis status and health check
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAnalysisStatus(req, res) {
    try {
      const mongoose = require('mongoose');
      
      const status = {
        timestamp: new Date().toISOString(),
        services: {
          dsrAnalysis: "operational",
          cancellationService: "operational",
          comparisonService: "operational",
          actionPlanGenerator: "operational"
        },
        database: {
          connected: mongoose.connection.readyState === 1,
          status: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
        },
        api: {
          openrouter: process.env.OPENROUTER_API_KEY ? "configured" : "not configured",
          rentalApi: "https://rentalapi.rootments.live/api/Reports/CancelReport"
        }
      };

      res.json(status);

    } catch (error) {
      console.error("❌ Status check failed:", error.message);
      res.status(500).json({ 
        error: `Status check failed: ${error.message}` 
      });
    }
  }
}

module.exports = new IntegratedAnalysisController();
