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

      // Create URL with query parameters for POST request
      const urlWithParams = new URL(this.apiUrl);
      Object.keys(queryParams).forEach(key => {
        urlWithParams.searchParams.append(key, queryParams[key]);
      });
      
      const response = await axios.post(urlWithParams.toString(), {}, {
        timeout: 30000,
        headers: {
          'User-Agent': 'DSR-Analysis-System/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Cancellation data fetched successfully");
      console.log("📊 Response status:", response.status);
      console.log("📊 Response content type:", response.headers['content-type']);
      
      // Check if response is valid
      let responseData = response.data;
      
      // If response is a string, try to parse it
      if (typeof responseData === 'string') {
        console.log("⚠️ Response is a string, attempting to parse...");
        console.log("📊 Raw response preview:", responseData.substring(0, 500));
        
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error("❌ Failed to parse response as JSON:", parseError.message);
          // Try to clean common JSON issues
          const cleaned = responseData
            .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas
            .replace(/\r\n/g, '\n')          // Normalize line endings
            .trim();
          
          try {
            responseData = JSON.parse(cleaned);
            console.log("✅ Successfully parsed cleaned JSON");
          } catch (secondError) {
            console.error("❌ Still cannot parse JSON after cleaning");
            throw new Error(`Invalid JSON response from API: ${parseError.message}`);
          }
        }
      }
      
      // Log summary information (don't show all data - will be filtered later)
      let totalRecords = 0;
      if (responseData.dataSet && responseData.dataSet.data) {
        totalRecords = responseData.dataSet.data.length;
      } else if (Array.isArray(responseData)) {
        totalRecords = responseData.length;
      }
      console.log(`📊 Total records received from API: ${totalRecords} (will be filtered by date)`);


      return {
        success: true,
        data: responseData,
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
   * Filter cancellation data by date
   * @param {Array} cancellationData - Raw cancellation data
   * @param {string} dateFrom - Start date to filter
   * @param {string} dateTo - End date to filter
   * @returns {Array} Filtered cancellation data
   */
  filterByDate(cancellationData, dateFrom, dateTo) {
    if (!Array.isArray(cancellationData)) {
      return [];
    }

    console.log(`\n🔍 Filtering cancellations for date range: ${dateFrom} to ${dateTo}`);
    
    // DEBUG: Show sample dates from API
    if (cancellationData.length > 0) {
      console.log(`\n📋 Sample dates from API (first 5 records):`);
      cancellationData.slice(0, 5).forEach((record, index) => {
        const cancelDate = record.cancelDate || record.CancelDate;
        console.log(`  ${index + 1}. ${cancelDate} - ${record.location || 'Unknown'}`);
      });
      console.log('');
    }
    
    // Convert filter dates to Date objects for comparison
    // Parse dates flexibly - handle both YYYY-M-D and YYYY-MM-DD formats
    const filterFromDate = new Date(dateFrom);
    const filterToDate = new Date(dateTo);
    
    // Set to start and end of day for proper comparison
    filterFromDate.setHours(0, 0, 0, 0);
    filterToDate.setHours(23, 59, 59, 999);
    
    console.log(`📅 Filter range: ${filterFromDate.toISOString()} to ${filterToDate.toISOString()}`);
    
    const filtered = cancellationData.filter(record => {
      // Check multiple possible date fields
      const cancelDate = record.cancelDate || record.CancelDate;
      
      if (!cancelDate) {
        return false; // Skip records without cancel date
      }

      // Parse the cancel date
      const recordDate = new Date(cancelDate);
      
      // Extract just the date part for comparison (ignore time)
      const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      const filterDateOnly = new Date(filterFromDate.getFullYear(), filterFromDate.getMonth(), filterFromDate.getDate());
      
      // Check if dates match (same year, month, day)
      const matches = recordDateOnly.getTime() === filterDateOnly.getTime();
      
      if (matches) {
        console.log(`  ✓ Match: ${record.location} - ${record.reasonForDelete} (${cancelDate})`);
      }
      
      return matches;
    });
    
    console.log(`📊 Found ${filtered.length} matching cancellations\n`);
    
    return filtered;
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
        storeWiseProblems: {}, // NEW: Track which stores have which problems
        topCancellationReasons: [],
        insights: []
      };

      // Analyze cancellation reasons
      cancellationData.forEach(record => {
        const reason = record.reasonForDelete || record.CancelReason || record.cancelReason || 'Unknown';
        const location = record.location || record.Location || record.LocationID || record.locationID || 'Unknown';
        const userId = record.UserID || record.userID || 'Unknown';
        const date = record.cancelDate || record.CancelDate || record.Date || 'Unknown';

        // Count reasons
        analysis.cancellationReasons[reason] = (analysis.cancellationReasons[reason] || 0) + 1;
        
        // Count by location
        analysis.locationWiseCancellations[location] = (analysis.locationWiseCancellations[location] || 0) + 1;
        
        // Count by user
        analysis.userWiseCancellations[userId] = (analysis.userWiseCancellations[userId] || 0) + 1;
        
        // Count by date
        analysis.dateWiseCancellations[date] = (analysis.dateWiseCancellations[date] || 0) + 1;
        
        // NEW: Track store-specific problems
        if (!analysis.storeWiseProblems[location]) {
          analysis.storeWiseProblems[location] = {
            storeName: location,
            totalCancellations: 0,
            reasons: {},
            topReasons: []
          };
        }
        analysis.storeWiseProblems[location].totalCancellations++;
        analysis.storeWiseProblems[location].reasons[reason] = (analysis.storeWiseProblems[location].reasons[reason] || 0) + 1;
      });

      // Get top cancellation reasons
      analysis.topCancellationReasons = Object.entries(analysis.cancellationReasons)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count, percentage: ((count / analysis.totalCancellations) * 100).toFixed(2) }));

      // Calculate top reasons for each store
      Object.keys(analysis.storeWiseProblems).forEach(storeName => {
        const storeData = analysis.storeWiseProblems[storeName];
        storeData.topReasons = Object.entries(storeData.reasons)
          .sort(([,a], [,b]) => b - a)
          .map(([reason, count]) => ({
            reason,
            count,
            percentage: ((count / storeData.totalCancellations) * 100).toFixed(2)
          }));
      });

      // Generate insights
      analysis.insights = this.generateCancellationInsights(analysis);

      console.log("✅ Cancellation pattern analysis completed");
      
      // Display store-wise problems clearly (only for DSR date)
      console.log("\n" + "=".repeat(80));
      console.log("🏪 STORE-WISE CANCELLATION PROBLEMS (DSR Date Only):");
      console.log("=".repeat(80));
      
      const sortedStores = Object.values(analysis.storeWiseProblems)
        .sort((a, b) => b.totalCancellations - a.totalCancellations);
      
      if (sortedStores.length === 0) {
        console.log("\n⚠️  No cancellations found on the DSR date");
        console.log("ℹ️  Will analyze DSR problems without cancellation correlation");
      } else {
        console.log(`\nFound cancellations at ${sortedStores.length} store(s):\n`);
        sortedStores.forEach((store, index) => {
          console.log(`${index + 1}. 🏪 ${store.storeName}`);
          console.log(`   Total Cancellations: ${store.totalCancellations}`);
          console.log(`   Top Problems:`);
          store.topReasons.slice(0, 5).forEach((reasonData, i) => {
            console.log(`      ${i + 1}) ${reasonData.reason}: ${reasonData.count} (${reasonData.percentage}%)`);
          });
          console.log('');
        });
      }
      
      console.log("=".repeat(80) + "\n");

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

      // Extract the actual data array from the response
      let dataArray = result.data;
      if (result.data && result.data.dataSet && result.data.dataSet.data) {
        dataArray = result.data.dataSet.data;
        console.log(`📊 Extracted ${dataArray.length} total records from API`);
      } else if (Array.isArray(result.data)) {
        dataArray = result.data;
      } else {
        console.log("⚠️ Unknown data structure:", typeof result.data);
      }

      // Filter cancellations to ONLY the DSR date
      const filteredData = this.filterByDate(dataArray, dateFrom, dateTo);
      console.log(`📊 Filtered to ${filteredData.length} cancellations for DSR date (${dateFrom})`);

      // Display STORE-WISE CANCELLATION DATA (Simple and Clear)
      if (filteredData.length > 0) {
        console.log("\n" + "=".repeat(80));
        console.log(`🏪 STORE-WISE CANCELLATION DATA (${dateFrom}):`);
        console.log("=".repeat(80));
        
        // Group by store
        const storeData = {};
        filteredData.forEach(record => {
          const storeName = record.location || 'Unknown Store';
          const reason = record.reasonForDelete || 'Unknown Reason';
          
          if (!storeData[storeName]) {
            storeData[storeName] = {
              totalCancellations: 0,
              reasons: {}
            };
          }
          
          storeData[storeName].totalCancellations++;
          storeData[storeName].reasons[reason] = (storeData[storeName].reasons[reason] || 0) + 1;
        });
        
        // Display each store
        const storeNames = Object.keys(storeData).sort();
        storeNames.forEach((storeName, index) => {
          const store = storeData[storeName];
          console.log(`\n${index + 1}. 🏪 ${storeName}`);
          console.log(`   Total Cancellations: ${store.totalCancellations}`);
          console.log(`   Cancellation Reasons:`);
          
          // Sort reasons by count
          const sortedReasons = Object.entries(store.reasons)
            .sort((a, b) => b[1] - a[1]);
          
          sortedReasons.forEach(([reason, count]) => {
            const percentage = ((count / store.totalCancellations) * 100).toFixed(1);
            console.log(`      • ${reason}: ${count} time${count > 1 ? 's' : ''} (${percentage}%)`);
          });
        });
        
        console.log("\n" + "=".repeat(80));
        console.log(`📊 SUMMARY: ${storeNames.length} store(s) with ${filteredData.length} total cancellation(s)`);
        console.log("=".repeat(80) + "\n");
      } else {
        console.log("\n" + "=".repeat(80));
        console.log(`⚠️  NO CANCELLATIONS ON DSR DATE (${dateFrom})`);
        console.log("=".repeat(80));
        console.log("ℹ️  No cancellation data found for this date.");
        console.log("=".repeat(80) + "\n");
      }

      // Analyze the cancellation data
      const analysis = this.analyzeCancellationPatterns(filteredData);
      
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
