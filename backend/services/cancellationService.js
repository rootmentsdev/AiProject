const axios = require('axios');

class CancellationService {
  constructor() {
    this.apiUrl = 'https://rentalapi.rootments.live/api/Reports/CancelReport';
  }

  /**
   * Fetch cancellation data from rental API
   * @param {Object} params - Query parameters for the API
   * @param {string} params.DateFrom - Start date (YYYY-M-D format)
   * @param {string} params.DateTo - End date (YYYY-M-D format)
   * @param {string} params.LocationID - Location ID (0 for all locations)
   * @param {string} params.UserID - User ID
   * @returns {Promise<Object>} Cancellation report data
   */
  async fetchCancellationData(params = {}) {
    try {
      console.log("🔗 Fetching cancellation data from rental API...");
      
      // Default parameters
      const defaultParams = {
        DateFrom: "2025-1-1",
        DateTo: "2025-10-23",
        LocationID: "0",
        UserID: "7777"
      };

      // Merge with provided parameters
      const queryParams = { ...defaultParams, ...params };
      
      console.log("📊 Query Parameters:", queryParams);

      const response = await axios.get(this.apiUrl, {
        params: queryParams,
        timeout: 30000,
        headers: {
          'User-Agent': 'DSR-Analysis-System/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Cancellation data fetched successfully");
      console.log("📊 Response status:", response.status);
      console.log("📊 Data preview:", JSON.stringify(response.data).substring(0, 500) + "...");

      return {
        success: true,
        data: response.data,
        queryParams: queryParams,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ Failed to fetch cancellation data:", error.message);
      console.error("❌ Error details:", error.response?.data || error.stack);
      
      return {
        success: false,
        error: error.message,
        details: error.response?.data || null,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze cancellation patterns and extract insights
   * @param {Array} cancellationData - Raw cancellation data from API
   * @returns {Object} Analyzed cancellation insights
   */
  analyzeCancellationPatterns(cancellationData) {
    try {
      console.log("🔍 Analyzing cancellation patterns...");
      
      if (!cancellationData || !Array.isArray(cancellationData)) {
        return {
          success: false,
          error: "Invalid cancellation data format"
        };
      }

      const analysis = {
        totalCancellations: cancellationData.length,
        cancellationReasons: {},
        locationWiseCancellations: {},
        userWiseCancellations: {},
        dateWiseCancellations: {},
        topCancellationReasons: [],
        insights: []
      };

      // Analyze cancellation reasons
      cancellationData.forEach(record => {
        const reason = record.CancelReason || record.cancelReason || 'Unknown';
        const location = record.LocationID || record.locationID || 'Unknown';
        const userId = record.UserID || record.userID || 'Unknown';
        const date = record.CancelDate || record.cancelDate || record.Date || 'Unknown';

        // Count reasons
        analysis.cancellationReasons[reason] = (analysis.cancellationReasons[reason] || 0) + 1;
        
        // Count by location
        analysis.locationWiseCancellations[location] = (analysis.locationWiseCancellations[location] || 0) + 1;
        
        // Count by user
        analysis.userWiseCancellations[userId] = (analysis.userWiseCancellations[userId] || 0) + 1;
        
        // Count by date
        analysis.dateWiseCancellations[date] = (analysis.dateWiseCancellations[date] || 0) + 1;
      });

      // Get top cancellation reasons
      analysis.topCancellationReasons = Object.entries(analysis.cancellationReasons)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count, percentage: ((count / analysis.totalCancellations) * 100).toFixed(2) }));

      // Generate insights
      analysis.insights = this.generateCancellationInsights(analysis);

      console.log("✅ Cancellation pattern analysis completed");
      return {
        success: true,
        analysis: analysis
      };

    } catch (error) {
      console.error("❌ Failed to analyze cancellation patterns:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate insights from cancellation analysis
   * @param {Object} analysis - Cancellation analysis data
   * @returns {Array} Array of insights
   */
  generateCancellationInsights(analysis) {
    const insights = [];

    // Top cancellation reason insight
    if (analysis.topCancellationReasons.length > 0) {
      const topReason = analysis.topCancellationReasons[0];
      insights.push({
        type: "primary_reason",
        message: `Primary cancellation reason: "${topReason.reason}" (${topReason.percentage}% of all cancellations)`,
        impact: "high",
        recommendation: `Focus on addressing issues related to "${topReason.reason}" to reduce cancellation rate`
      });
    }

    // Multiple reasons insight
    const uniqueReasons = Object.keys(analysis.cancellationReasons).length;
    if (uniqueReasons > 3) {
      insights.push({
        type: "multiple_reasons",
        message: `Multiple cancellation reasons detected (${uniqueReasons} different reasons)`,
        impact: "medium",
        recommendation: "Implement comprehensive cancellation prevention strategy"
      });
    }

    // Location-based insights
    const locations = Object.keys(analysis.locationWiseCancellations);
    if (locations.length > 1) {
      const locationStats = locations.map(loc => ({
        location: loc,
        cancellations: analysis.locationWiseCancellations[loc]
      })).sort((a, b) => b.cancellations - a.cancellations);

      insights.push({
        type: "location_analysis",
        message: `Location with highest cancellations: ${locationStats[0].location} (${locationStats[0].cancellations} cancellations)`,
        impact: "medium",
        recommendation: `Investigate specific issues at ${locationStats[0].location}`
      });
    }

    // Volume insight
    if (analysis.totalCancellations > 50) {
      insights.push({
        type: "high_volume",
        message: `High cancellation volume detected (${analysis.totalCancellations} cancellations)`,
        impact: "high",
        recommendation: "Immediate action required to reduce cancellation rate"
      });
    }

    return insights;
  }

  /**
   * Get cancellation data for specific date range
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @param {string} locationID - Location ID (optional)
   * @param {string} userID - User ID (optional)
   * @returns {Promise<Object>} Cancellation data and analysis
   */
  async getCancellationAnalysis(dateFrom, dateTo, locationID = "0", userID = "7777") {
    try {
      console.log(`📅 Fetching cancellation data from ${dateFrom} to ${dateTo}`);
      
      const params = {
        DateFrom: dateFrom,
        DateTo: dateTo,
        LocationID: locationID,
        UserID: userID
      };

      const result = await this.fetchCancellationData(params);
      
      if (!result.success) {
        return result;
      }

      // Analyze the cancellation data
      const analysis = this.analyzeCancellationPatterns(result.data);
      
      return {
        success: true,
        rawData: result.data,
        analysis: analysis.success ? analysis.analysis : null,
        queryParams: result.queryParams,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error("❌ Failed to get cancellation analysis:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CancellationService();
