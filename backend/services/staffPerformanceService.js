const axios = require('axios');

class StaffPerformanceService {
  constructor() {
    this.apiUrl = 'https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel';
  }

  /**
   * Fetch staff performance data from rental API
   * @param {Object} params - Query parameters for the API
   * @param {string} params.DateFrom - Start date (YYYY-M-D format)
   * @param {string} params.DateTo - End date (YYYY-M-D format)
   * @param {string} params.LocationID - Location ID
   * @param {string} params.UserID - User ID
   * @returns {Promise<Object>} Staff performance report data
   */
  async fetchStaffPerformanceData(params = {}) {
    try {
      console.log("\n" + "=".repeat(80));
      console.log("🔗 FETCHING STAFF PERFORMANCE DATA FROM RENTAL API");
      console.log("=".repeat(80));
      
      // Default parameters
      const defaultParams = {
        DateFrom: "2025-8-21",
        DateTo: "2025-8-21",
        LocationID: "0",
        UserID: "7777"
      };

      // Merge with provided parameters
      const queryParams = { ...defaultParams, ...params };
      
      console.log("📊 Staff Performance Query Parameters:");
      console.log("   DateFrom:", queryParams.DateFrom);
      console.log("   DateTo:", queryParams.DateTo);
      console.log("   LocationID:", queryParams.LocationID);
      console.log("   UserID:", queryParams.UserID);
      console.log("🌐 API URL:", this.apiUrl);
      console.log("📤 Request Method: POST with JSON body");
      
      // Send parameters in POST body as JSON (like Postman)
      const response = await axios.post(this.apiUrl, queryParams, {
        timeout: 30000,
        headers: {
          'User-Agent': 'DSR-Analysis-System/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log("✅ Request sent with body:", JSON.stringify(queryParams));

      console.log("✅ Staff performance data fetched successfully");
      console.log("📊 Response status:", response.status);
      console.log("📊 Response headers:", response.headers['content-type']);
      
      // Check if response is valid
      let responseData = response.data;
      
      console.log("📊 Response data type:", typeof responseData);
      if (typeof responseData === 'object' && responseData !== null) {
        console.log("📊 Response data keys:", Object.keys(responseData).join(', '));
        
        // Check dataSet structure
        if (responseData.dataSet) {
          console.log("📊 dataSet keys:", Object.keys(responseData.dataSet).join(', '));
          console.log("📊 dataSet type:", typeof responseData.dataSet);
          
          if (responseData.dataSet.data) {
            console.log("📊 dataSet.data type:", typeof responseData.dataSet.data);
            console.log("📊 dataSet.data is array:", Array.isArray(responseData.dataSet.data));
            if (Array.isArray(responseData.dataSet.data)) {
              console.log("📊 dataSet.data length:", responseData.dataSet.data.length);
            }
          } else {
            console.log("⚠️ dataSet.data does not exist");
            console.log("📊 dataSet contents:", JSON.stringify(responseData.dataSet).substring(0, 200));
          }
        }
      }
      
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
      
      // Log summary information
      let totalRecords = 0;
      if (responseData.dataSet && responseData.dataSet.data) {
        totalRecords = responseData.dataSet.data.length;
      } else if (Array.isArray(responseData)) {
        totalRecords = responseData.length;
      }
      console.log(`📊 Total staff performance records received: ${totalRecords}`);

      return {
        success: true,
        data: responseData,
        queryParams: queryParams,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("\n" + "=".repeat(80));
      console.error("❌ FAILED TO FETCH STAFF PERFORMANCE DATA");
      console.error("=".repeat(80));
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", error.code);
      
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      } else if (error.request) {
        console.error("❌ No response received from API");
        console.error("❌ Request details:", error.request._header);
      } else {
        console.error("❌ Error setting up request:", error.stack);
      }
      
      console.error("=".repeat(80) + "\n");
      
      return {
        success: false,
        error: error.message,
        details: error.response?.data || null,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze staff performance patterns and extract insights
   * @param {Array} staffPerformanceData - Raw staff performance data from API
   * @returns {Object} Analyzed staff performance insights
   */
  analyzeStaffPerformance(staffPerformanceData) {
    try {
      console.log("\n🔍 Analyzing staff performance patterns...");
      console.log(`📊 Total records to analyze: ${staffPerformanceData ? staffPerformanceData.length : 0}`);
      
      if (!staffPerformanceData || !Array.isArray(staffPerformanceData)) {
        console.log("❌ Invalid data format - not an array");
        return {
          success: false,
          error: "Invalid staff performance data format"
        };
      }

      if (staffPerformanceData.length === 0) {
        console.log("⚠️ No staff performance records to analyze");
        return {
          success: true,
          analysis: {
            totalRecords: 0,
            storeWisePerformance: {},
            overallMetrics: {
              totalWalkIns: 0,
              totalBills: 0,
              totalQuantity: 0,
              totalLossOfSale: 0,
              averageConversionRate: 0
            },
            insights: []
          }
        };
      }

      const analysis = {
        totalRecords: staffPerformanceData.length,
        storeWisePerformance: {}, // Track performance by store
        overallMetrics: {
          totalWalkIns: 0,
          totalBills: 0,
          totalQuantity: 0,
          totalLossOfSale: 0,
          averageConversionRate: 0
        },
        insights: []
      };

      // Analyze staff performance by store/location
      let firstRecordLogged = false;
      staffPerformanceData.forEach((record, index) => {
        // Handle different field name formats from API
        const location = record.location || record.Location || record.store || record.storeName || 
                        record.LocationID || record.locationName || 'Unknown';
        
        // Log first record for debugging
        if (!firstRecordLogged) {
          console.log("\n📋 Processing first record:");
          console.log("   All fields:", Object.keys(record).join(', '));
          console.log("   Detected location:", location);
          firstRecordLogged = true;
        }
        
        // Map actual API field names
        const staffName = record.bookingBy || record.staffName || record.name || 'Unknown Staff';
        const bills = parseFloat(record.created_Number_Of_Bill || record.total_Number_Of_Bill || 
                                 record.bills || record.Bills || 0);
        const quantity = parseFloat(record.createdQuantity || record.totalQuantity || 
                                   record.quantity || record.Quantity || 0);
        const value = parseFloat(record.createdValue || record.totalValue || 
                                record.value || record.Value || 0);
        
        // Calculate walk-ins (if not provided, estimate from bills)
        const walkIns = parseFloat(record.walkIns || record.WalkIns || 
                                   record.total_walkins || (bills > 0 ? bills * 1.5 : 0));
        
        // Loss of sale (canceled bills)
        const lossOfSale = parseFloat(record.canceled_Number_Of_Bill || record.lossOfSale || 
                                     record.LossOfSale || 0);
        
        const conversionRate = walkIns > 0 ? ((bills / walkIns) * 100).toFixed(2) : 
                              (bills > 0 ? 100 : 0); // If no walk-ins but has bills, assume 100%

        // Initialize store data if not exists
        if (!analysis.storeWisePerformance[location]) {
          analysis.storeWisePerformance[location] = {
            storeName: location,
            walkIns: 0,
            bills: 0,
            quantity: 0,
            lossOfSale: 0,
            conversionRate: 0,
            staffCount: 0,
            staffDetails: []
          };
        }

        // Aggregate store metrics
        analysis.storeWisePerformance[location].walkIns += walkIns;
        analysis.storeWisePerformance[location].bills += bills;
        analysis.storeWisePerformance[location].quantity += quantity;
        analysis.storeWisePerformance[location].lossOfSale += lossOfSale;
        analysis.storeWisePerformance[location].staffCount++;
        
        // Add staff details
        analysis.storeWisePerformance[location].staffDetails.push({
          name: staffName,
          walkIns,
          bills,
          quantity,
          lossOfSale,
          conversionRate: parseFloat(conversionRate),
          value: value
        });

        // Update overall metrics
        analysis.overallMetrics.totalWalkIns += walkIns;
        analysis.overallMetrics.totalBills += bills;
        analysis.overallMetrics.totalQuantity += quantity;
        analysis.overallMetrics.totalLossOfSale += lossOfSale;
      });

      // Calculate store-level conversion rates and identify poor performers
      Object.keys(analysis.storeWisePerformance).forEach(storeName => {
        const storeData = analysis.storeWisePerformance[storeName];
        storeData.conversionRate = storeData.walkIns > 0 
          ? ((storeData.bills / storeData.walkIns) * 100).toFixed(2) 
          : 0;
        
        // Determine performance status
        const convRate = parseFloat(storeData.conversionRate);
        if (convRate < 50) {
          storeData.performanceStatus = 'CRITICAL';
        } else if (convRate < 70) {
          storeData.performanceStatus = 'POOR';
        } else if (convRate < 85) {
          storeData.performanceStatus = 'AVERAGE';
        } else {
          storeData.performanceStatus = 'GOOD';
        }

        // Identify staff issues
        storeData.staffIssues = [];
        storeData.staffDetails.forEach(staff => {
          if (staff.conversionRate < 50) {
            storeData.staffIssues.push(`${staff.name} has critically low conversion (${staff.conversionRate}%)`);
          }
          if (staff.lossOfSale > 10) {
            storeData.staffIssues.push(`${staff.name} has high loss of sale (${staff.lossOfSale})`);
          }
        });
      });

      // Calculate overall conversion rate
      if (analysis.overallMetrics.totalWalkIns > 0) {
        analysis.overallMetrics.averageConversionRate = (
          (analysis.overallMetrics.totalBills / analysis.overallMetrics.totalWalkIns) * 100
        ).toFixed(2);
      }

      // Generate insights
      analysis.insights = this.generateStaffPerformanceInsights(analysis);

      console.log("✅ Staff performance analysis completed");
      
      // Display store-wise performance
      console.log("\n" + "=".repeat(80));
      console.log("👥 STORE-WISE STAFF PERFORMANCE (DSR Date):");
      console.log("=".repeat(80));
      
      const sortedStores = Object.values(analysis.storeWisePerformance)
        .sort((a, b) => parseFloat(a.conversionRate) - parseFloat(b.conversionRate)); // Lowest first
      
      if (sortedStores.length === 0) {
        console.log("\n⚠️  No staff performance data found");
      } else {
        console.log(`\nAnalyzed ${sortedStores.length} store(s):\n`);
        sortedStores.forEach((store, index) => {
          const perfIcon = store.performanceStatus === 'CRITICAL' ? '🔴' :
                          store.performanceStatus === 'POOR' ? '🟠' :
                          store.performanceStatus === 'AVERAGE' ? '🟡' : '🟢';
          
          console.log(`${index + 1}. ${perfIcon} ${store.storeName}`);
          console.log(`   Status: ${store.performanceStatus}`);
          console.log(`   Conversion Rate: ${store.conversionRate}%`);
          console.log(`   Walk-ins: ${store.walkIns} | Bills: ${store.bills} | Quantity: ${store.quantity}`);
          console.log(`   Loss of Sale: ${store.lossOfSale}`);
          console.log(`   Staff Count: ${store.staffCount}`);
          
          if (store.staffIssues.length > 0) {
            console.log(`   ⚠️ Staff Issues:`);
            store.staffIssues.forEach(issue => {
              console.log(`      • ${issue}`);
            });
          }
          console.log('');
        });
      }
      
      console.log("=".repeat(80) + "\n");

      return {
        success: true,
        analysis: analysis
      };

    } catch (error) {
      console.error("❌ Failed to analyze staff performance:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate insights from staff performance analysis
   * @param {Object} analysis - Staff performance analysis data
   * @returns {Array} Array of insights
   */
  generateStaffPerformanceInsights(analysis) {
    const insights = [];

    // Overall conversion rate insight
    const avgConvRate = parseFloat(analysis.overallMetrics.averageConversionRate);
    if (avgConvRate < 60) {
      insights.push({
        type: "low_overall_conversion",
        message: `Overall conversion rate is low (${avgConvRate}%)`,
        impact: "high",
        recommendation: "Urgent: Implement company-wide sales training program"
      });
    }

    // Identify worst performing stores
    const storesByPerformance = Object.values(analysis.storeWisePerformance)
      .sort((a, b) => parseFloat(a.conversionRate) - parseFloat(b.conversionRate));
    
    if (storesByPerformance.length > 0) {
      const worstStore = storesByPerformance[0];
      if (parseFloat(worstStore.conversionRate) < 60) {
        insights.push({
          type: "worst_performing_store",
          message: `${worstStore.storeName} has the lowest conversion rate (${worstStore.conversionRate}%)`,
          impact: "high",
          recommendation: `Immediate intervention needed at ${worstStore.storeName} - staff training and process review`
        });
      }
    }

    // High loss of sale insight
    if (analysis.overallMetrics.totalLossOfSale > 50) {
      insights.push({
        type: "high_loss_of_sale",
        message: `High overall loss of sale detected (${analysis.overallMetrics.totalLossOfSale})`,
        impact: "high",
        recommendation: "Investigate reasons for lost sales and implement retention strategies"
      });
    }

    return insights;
  }

  /**
   * Get staff performance analysis for specific store and date range
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @param {string} locationID - Location ID (0 for all locations)
   * @param {string} userID - User ID
   * @returns {Promise<Object>} Staff performance data and analysis
   */
  async getStaffPerformanceAnalysis(dateFrom, dateTo, locationID = "0", userID = "7777") {
    try {
      console.log(`📅 Fetching staff performance data from ${dateFrom} to ${dateTo} for location ${locationID}`);
      
      const params = {
        DateFrom: dateFrom,
        DateTo: dateTo,
        LocationID: locationID,
        UserID: userID
      };

      const result = await this.fetchStaffPerformanceData(params);
      
      if (!result.success) {
        return result;
      }

      // Extract the actual data array from the response
      let dataArray = [];
      
      console.log("\n🔍 Extracting data from API response...");
      console.log("📊 Response structure:", typeof result.data);
      
      if (result.data && result.data.dataSet) {
        console.log("📊 Found dataSet object");
        
        if (result.data.dataSet.data) {
          dataArray = result.data.dataSet.data;
          console.log(`✅ Extracted ${dataArray.length} records from dataSet.data`);
          
          // Show sample record structure
          if (dataArray.length > 0) {
            console.log("📋 Sample record fields:", Object.keys(dataArray[0]).join(', '));
            console.log("📋 First record:", JSON.stringify(dataArray[0], null, 2));
          }
        } else {
          console.log("⚠️ dataSet.data is empty or undefined");
        }
      } else if (Array.isArray(result.data)) {
        dataArray = result.data;
        console.log(`📊 Response is direct array with ${dataArray.length} records`);
      } else {
        console.log("⚠️ Unknown data structure");
        console.log("📊 Available keys:", result.data ? Object.keys(result.data).join(', ') : 'none');
      }

      // Analyze the staff performance data
      const analysis = this.analyzeStaffPerformance(dataArray);
      
      return {
        success: true,
        rawData: result.data,
        analysis: analysis.success ? analysis.analysis : null,
        queryParams: result.queryParams,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error("❌ Failed to get staff performance analysis:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new StaffPerformanceService();

