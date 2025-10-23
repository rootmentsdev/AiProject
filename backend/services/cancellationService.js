const axios = require('axios');

class CancellationService {
  constructor() {
    this.apiUrl = 'https://rentalapi.rootments.live/api/Reports/CancelReport';
  }

  async fetchCancellationData(params = {}) {
    try {
      console.log("🔗 Fetching cancellation data from rental API...");

      const defaultParams = {
        DateFrom: "2025-1-1",
        DateTo: "2025-10-23",
        LocationID: "0",
        UserID: "7777"
      };

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
      return {
        success: true,
        data: response.data,
        queryParams,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ Failed to fetch cancellation data:", error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || null,
        timestamp: new Date().toISOString()
      };
    }
  }

  analyzeCancellationPatterns(cancellationData) {
    try {
      console.log("🔍 Analyzing cancellation patterns...");

      if (!Array.isArray(cancellationData)) {
        return { success: false, error: "Invalid cancellation data format" };
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

      cancellationData.forEach(record => {
        const reason = record.CancelReason || record.cancelReason || 'Unknown';
        const location = record.LocationID || record.locationID || 'Unknown';
        const userId = record.UserID || record.userID || 'Unknown';
        const date = record.CancelDate || record.cancelDate || record.Date || 'Unknown';

        analysis.cancellationReasons[reason] = (analysis.cancellationReasons[reason] || 0) + 1;
        analysis.locationWiseCancellations[location] = (analysis.locationWiseCancellations[location] || 0) + 1;
        analysis.userWiseCancellations[userId] = (analysis.userWiseCancellations[userId] || 0) + 1;
        analysis.dateWiseCancellations[date] = (analysis.dateWiseCancellations[date] || 0) + 1;
      });

      analysis.topCancellationReasons = Object.entries(analysis.cancellationReasons)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count, percentage: ((count / analysis.totalCancellations) * 100).toFixed(2) }));

      analysis.insights = this.generateCancellationInsights(analysis);

      return { success: true, analysis };

    } catch (error) {
      console.error("❌ Failed to analyze cancellation patterns:", error.message);
      return { success: false, error: error.message };
    }
  }

  generateCancellationInsights(analysis) {
    const insights = [];

    if (analysis.topCancellationReasons.length > 0) {
      const topReason = analysis.topCancellationReasons[0];
      insights.push({
        type: "primary_reason",
        message: `Primary cancellation reason: "${topReason.reason}" (${topReason.percentage}% of all cancellations)`,
        impact: "high",
        recommendation: `Focus on addressing issues related to "${topReason.reason}" to reduce cancellation rate`
      });
    }

    if (Object.keys(analysis.cancellationReasons).length > 3) {
      insights.push({
        type: "multiple_reasons",
        message: `Multiple cancellation reasons detected`,
        impact: "medium",
        recommendation: "Implement comprehensive cancellation prevention strategy"
      });
    }

    const locationStats = Object.entries(analysis.locationWiseCancellations)
      .map(([location, count]) => ({ location, count }))
      .sort((a,b) => b.count - a.count);

    if (locationStats.length > 0) {
      insights.push({
        type: "location_analysis",
        message: `Location with highest cancellations: ${locationStats[0].location} (${locationStats[0].count} cancellations)`,
        impact: "medium",
        recommendation: `Investigate issues at ${locationStats[0].location}`
      });
    }

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

  async getCancellationAnalysis(dateFrom, dateTo, locationID = "0", userID = "7777") {
    try {
      const result = await this.fetchCancellationData({ DateFrom: dateFrom, DateTo: dateTo, LocationID: locationID, UserID: userID });

      if (!result.success) return result;

      const analysis = this.analyzeCancellationPatterns(result.data);
      return {
        success: true,
        rawData: result.data,
        analysis: analysis.success ? analysis.analysis : {},
        queryParams: result.queryParams,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error("❌ Failed to get cancellation analysis:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CancellationService();
