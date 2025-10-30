const dsrModel = require('../models/dsrModel');
const DailyResponse = require('../models/dailyResponseModel');
const axios = require('axios');

class DSRController {
  async analyzeSheet(req, res) {
    try {
      console.log("🔗 Analyzing Suitor Guy Kerala DSR Sheet...");
      
      const startTime = Date.now();
      
      // Fetch data from hardcoded Google Sheet
      const dsrDataResult = await dsrModel.fetchSheetData();
      
      if (!dsrDataResult || !dsrDataResult.data || dsrDataResult.data.trim() === '') {
        console.error("❌ No valid data found in sheet");
        return res.status(400).json({ error: "No valid data found in the Google Sheet. Please check the sheet content." });
      }

      console.log("📊 DSR Data Preview:", dsrDataResult.data.substring(0, 500) + "...");
      console.log("📅 DSR Sheet Date:", dsrDataResult.date);
      
      // Analyze DSR data with AI
      const result = await dsrModel.analyzeWithAI(dsrDataResult);
      
      // Add the sheet date to the result
      result.sheetDate = dsrDataResult.date;
      
      const responseTime = Date.now() - startTime;
      
      // Save the response to MongoDB
      try {
        const mongoose = require('mongoose');
        
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
          console.log("⚠️ MongoDB not connected, skipping save. Connection state:", mongoose.connection.readyState);
          console.log("⚠️ Analysis result will still be returned to frontend");
        } else {
          const date = new Date();
          const dateString = date.toISOString().split('T')[0];
          
          const dailyResponse = new DailyResponse({
            date: date,
            dateString: dateString,
            analysisData: result,
            analysisSummary: result.analysisSummary || {},
            modelUsed: dsrModel.lastUsedModel || 'anthropic/claude-3-haiku',
            responseTime: responseTime
          });
          
          await dailyResponse.save();
          console.log(`✅ Saved daily response to MongoDB (${dateString})`);
          console.log(`📊 Response ID: ${dailyResponse._id}`);
        }
      } catch (saveError) {
        console.error("❌ Failed to save response to MongoDB:", saveError.message);
        console.error("❌ Error details:", saveError);
        // Continue even if save fails - don't block the response
      }
      
      res.json(result);
      
    } catch (err) {
      console.error("❌ DSR Sheet Analysis Failed:", err.message);
      console.error("❌ Error details:", err.response?.data || err.stack);
      
      if (err.response?.status === 403) {
        return res.status(400).json({ error: "Access denied. Please ensure the Google Sheet is publicly accessible (Anyone with the link can view)." });
      } else if (err.response?.status === 404) {
        return res.status(400).json({ error: "Google Sheet not found. Please check the URL." });
      } else if (err.code === 'ECONNABORTED') {
        return res.status(500).json({ error: "Request timeout. The sheet might be too large or slow to access." });
      }
      
      res.status(500).json({ error: `Failed to analyze DSR sheet: ${err.message}` });
    }
  }

  async getCancellationData(req, res) {
    try {
      console.log("📊 Fetching cancellation data...");
      
      const { DateFrom, DateTo, LocationID, UserID } = req.query;
      const cancellationService = require('../services/cancellationService');
      const { convertDSRDateToDateRange } = require('../utils/dateConverter');
      
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

  performIntegratedAnalysis = async (req, res) => {
    try {
      console.log("\n" + "=".repeat(100));
      console.log("🚀 INTEGRATED ANALYSIS REQUEST RECEIVED FROM FRONTEND");
      console.log("=".repeat(100));
      console.log("⏰ Time:", new Date().toLocaleString());
      console.log("📍 Endpoint: POST /api/integrated-analysis");
      console.log("=".repeat(100) + "\n");
      
      // Step 1: Get DSR Analysis
      console.log("📊 Step 1: Fetching DSR data...");
      const dsrDataResult = await dsrModel.fetchSheetData();
      const dsrAnalysis = await dsrModel.analyzeWithAI(dsrDataResult);
      
      // Step 2: Get Cancellation Data
      console.log("📊 Step 2: Fetching cancellation data...");
      const { convertMultipleDatesToRange } = require('../utils/dateConverter');
      
      // If we have different dates for South and North clusters, fetch cancellations for BOTH
      let cancellationDateRange;
      if (dsrDataResult.southDate && dsrDataResult.northDate) {
        console.log(`📅 South Cluster Date: ${dsrDataResult.southDate}`);
        console.log(`📅 North Cluster Date: ${dsrDataResult.northDate}`);
        
        // Create a date range covering both cluster dates
        cancellationDateRange = convertMultipleDatesToRange([
          dsrDataResult.southDate,
          dsrDataResult.northDate
        ]);
        
        console.log(`📅 Fetching cancellations for date range: ${cancellationDateRange.DateFrom} to ${cancellationDateRange.DateTo}`);
      } else {
        // Fallback to single date
      const { convertDSRDateToDateRange } = require('../utils/dateConverter');
        const dsrSheetDate = dsrDataResult.date || "21/8/2025";
        cancellationDateRange = convertDSRDateToDateRange(dsrSheetDate);
        console.log(`📅 Fetching cancellations for: ${cancellationDateRange.DateFrom}`);
      }
      
      const cancellationService = require('../services/cancellationService');
      const cancellationResult = await cancellationService.getCancellationAnalysis(
        cancellationDateRange.DateFrom,
        cancellationDateRange.DateTo,
        "0",
        "7777"
      );
      
      // Step 3: Get Staff Performance Data (for each store individually)
      console.log("📊 Step 3: Fetching staff performance data...");
      const staffPerformanceService = require('../services/staffPerformanceService');
      const { getLocationIDFromStoreName } = require('../config/storeLocationMapping');
      
      // Use the MOST RECENT DSR date for staff performance (North Cluster date: 21/8/2025)
      // This ensures staff data matches the DSR date being analyzed
      const staffPerformanceDate = dsrDataResult.date; // This is the most recent date (North: 21/8/2025)
      const staffPerformanceDateRange = require('../utils/dateConverter').convertDSRDateToDateRange(staffPerformanceDate);
      
      console.log(`📅 Using DSR date for staff performance: ${staffPerformanceDate}`);
      console.log(`📅 Staff performance date range: ${staffPerformanceDateRange.DateFrom} to ${staffPerformanceDateRange.DateTo}`);
      
      let staffPerformanceResult = { success: true, analysis: { storeWisePerformance: {} } };
      
      // ✅ FIX: Declare allUniqueStores outside try blocks so it's accessible everywhere
      let allUniqueStores = new Set();
      
      try {
        // Get all unique store names from BOTH DSR analysis AND cancellation analysis
        const dsrStores = dsrAnalysis.problemStores || dsrAnalysis.badPerformingStores || [];
        const cancellationStoreNames = Object.keys(cancellationResult?.analysis?.storeWiseProblems || {});
        
        // Combine and deduplicate store names
        allUniqueStores = new Set([
          ...dsrStores.map(s => s.storeName || s.name),
          ...cancellationStoreNames
        ]);
        
        console.log(`📊 Fetching staff performance for ${allUniqueStores.size} stores (DSR + cancellation stores)...`);
        
        // Fetch staff performance for each store individually
        for (const storeName of allUniqueStores) {
          const locationID = getLocationIDFromStoreName(storeName);
          
          if (locationID) {
            console.log(`   📍 Fetching staff data for ${storeName} (Location ID: ${locationID})...`);
            
            try {
              const storeStaffData = await staffPerformanceService.getStaffPerformanceAnalysis(
                staffPerformanceDateRange.DateFrom,
                staffPerformanceDateRange.DateTo,
                locationID,
                "7777"
              );
              
              if (storeStaffData && storeStaffData.success && storeStaffData.analysis) {
                // Add this store's staff performance to the result
                Object.assign(staffPerformanceResult.analysis.storeWisePerformance, 
                            storeStaffData.analysis.storeWisePerformance || {});
                console.log(`   ✅ Staff data fetched for ${storeName}`);
              } else {
                console.log(`   ⚠️ No staff data for ${storeName}`);
              }
            } catch (storeError) {
              console.log(`   ⚠️ Failed to fetch staff data for ${storeName}: ${storeError.message}`);
            }
          } else {
            console.log(`   ⚠️ No location ID mapping found for ${storeName}`);
          }
        }
        
        const totalStoresWithStaffData = Object.keys(staffPerformanceResult.analysis.storeWisePerformance).length;
        console.log(`📊 Staff performance data available for ${totalStoresWithStaffData} out of ${allUniqueStores.size} stores`);
        
      } catch (staffError) {
        console.error("❌ Staff performance fetch failed:", staffError.message);
        console.log("⚠️ Continuing analysis without staff performance data");
        staffPerformanceResult = { success: false, analysis: { storeWisePerformance: {} } };
      }
      
      // Step 4: Get Attendance Data for DSR Date
      console.log("📊 Step 4: Fetching attendance data for DSR date...");
      const attendanceModel = require('../models/attendanceModel');
      let attendanceResult = { success: false, data: null };
      
      try {
        const attendanceData = await attendanceModel.fetchAttendanceData(dsrDataResult.date);
        attendanceResult = {
          success: true,
          data: attendanceData.data,
          month: attendanceData.month,
          year: attendanceData.year,
          dsrDay: attendanceData.currentDay
        };
        
        console.log(`✅ Attendance data fetched for ${attendanceData.month} ${attendanceData.year}`);
        console.log(`📅 DSR Date Day: ${attendanceData.currentDay}`);
        console.log(`👥 Total Employees: ${attendanceData.data.employees.length}`);
        
        // Analyze attendance issues on DSR date
        const attendanceIssues = this.analyzeAttendanceForDSRDate(
          attendanceData.data.employees, 
          attendanceData.currentDay,
          allUniqueStores
        );
        
        console.log(`⚠️  Attendance Issues Found: ${attendanceIssues.totalIssues}`);
        attendanceResult.issues = attendanceIssues;
        
      } catch (attendanceError) {
        console.error("❌ Attendance data fetch failed:", attendanceError.message);
        console.log("⚠️ Continuing analysis without attendance data");
      }
      
      // Step 5: Get Loss of Sale Data for DSR Date
      console.log("📊 Step 5: Fetching loss of sale data for DSR date...");
      const lossOfSaleModel = require('../models/lossOfSaleModel');
      let lossOfSaleResult = { success: false, data: [], groupedByStore: {} };
      
      try {
        // Fetch all stores loss of sale data
        const allLossData = await lossOfSaleModel.fetchAllStoresData();
        
        // Filter by DSR date
        const filteredLossData = lossOfSaleModel.filterByDate(allLossData.data, dsrDataResult.date);
        
        // Group by store
        const groupedLoss = lossOfSaleModel.groupByStore(filteredLossData);
        
        // Analyze reasons
        const reasonAnalysis = lossOfSaleModel.analyzeReasons(filteredLossData);
        
        lossOfSaleResult = {
          success: true,
          data: filteredLossData,
          groupedByStore: groupedLoss,
          totalEntries: filteredLossData.length,
          reasonAnalysis: reasonAnalysis,
          date: dsrDataResult.date
        };
        
        console.log(`✅ Loss of Sale data fetched: ${filteredLossData.length} entries for ${dsrDataResult.date}`);
        console.log(`📊 Stores with loss of sale: ${Object.keys(groupedLoss).length}`);
        
        // Log top reasons
        if (reasonAnalysis.length > 0) {
          console.log(`🔍 Top loss reasons:`);
          reasonAnalysis.slice(0, 3).forEach((r, idx) => {
            console.log(`   ${idx + 1}. ${r.reason}: ${r.count} cases`);
          });
        }
        
      } catch (lossError) {
        console.error("❌ Loss of Sale data fetch failed:", lossError.message);
        console.log("⚠️ Continuing analysis without loss of sale data");
      }
      
      // Step 6: Compare stores to identify critical, DSR-only, and cancellation-only stores
      console.log("\n📊 Step 6: Comparing stores to identify problem categories...");
      const comparisonResult = this.compareStores(dsrAnalysis, cancellationResult, staffPerformanceResult);
      
      // Step 7: Generate AI-Powered CEO Action Plans (with Loss of Sale data)
      console.log("\n🤖 Step 7: Generating AI-powered action plans...");
      const actionPlans = await this.generateCEOActionPlans(
        comparisonResult, // ✅ FIX: Pass comparisonResult instead of dsrAnalysis
        cancellationResult,
        staffPerformanceResult,
        dsrDataResult.storeWalkIns, // Pass walk-ins from DSR sheet
        attendanceResult, // Pass attendance data
        lossOfSaleResult // Pass loss of sale data
      );
      
      console.log('\n✅ INTEGRATED ANALYSIS COMPLETED SUCCESSFULLY!');
      console.log('📊 Sending response to frontend...\n');
      
      res.json(actionPlans);
      
    } catch (error) {
      console.error("❌ Integrated analysis failed:", error.message);
      res.status(500).json({ 
        error: `Integrated analysis failed: ${error.message}` 
      });
    }
  }

  // Analyze attendance issues on DSR date for each store
  analyzeAttendanceForDSRDate(employees, dsrDay, storeNames) {
    const dayKey = String(dsrDay); // Convert day to string key
    const storeIssues = {};
    let totalIssues = 0;
    
    console.log(`\n📅 Analyzing Attendance for Day ${dsrDay}:`);
    
    employees.forEach(emp => {
      const branch = emp.branch || emp.Branch || 'UNKNOWN';
      const name = emp.employee_name || emp.name || 'Unknown';
      const designation = emp.designation || emp.Designation || 'N/A';
      const attendanceCode = emp[dayKey]?.trim().toUpperCase() || 'N/A';
      
      // Check for attendance issues (Absent, LOP, Leave, etc.)
      const isIssue = ['A', 'LOP', 'L', 'AL', 'H/D'].includes(attendanceCode);
      
      if (isIssue) {
        if (!storeIssues[branch]) {
          storeIssues[branch] = {
            storeName: branch,
            absentEmployees: [],
            lopEmployees: [],
            leaveEmployees: [],
            halfDayEmployees: [],
            totalIssues: 0
          };
        }
        
        const issue = {
          name,
          designation,
          status: attendanceCode
        };
        
        if (attendanceCode === 'A') {
          storeIssues[branch].absentEmployees.push(issue);
        } else if (attendanceCode === 'LOP') {
          storeIssues[branch].lopEmployees.push(issue);
        } else if (attendanceCode === 'L' || attendanceCode === 'AL') {
          storeIssues[branch].leaveEmployees.push(issue);
        } else if (attendanceCode === 'H/D') {
          storeIssues[branch].halfDayEmployees.push(issue);
        }
        
        storeIssues[branch].totalIssues++;
        totalIssues++;
        
        console.log(`   ⚠️  ${branch} - ${name} (${designation}): ${attendanceCode}`);
      }
    });
    
    // Add summary
    console.log(`\n📊 Attendance Issues Summary:`);
    for (const [branch, issues] of Object.entries(storeIssues)) {
      console.log(`   ${branch}: ${issues.totalIssues} issues (${issues.absentEmployees.length}A, ${issues.lopEmployees.length}LOP, ${issues.leaveEmployees.length}L, ${issues.halfDayEmployees.length}H/D)`);
    }
    
    return {
      storeWiseIssues: storeIssues,
      totalIssues,
      dsrDay
    };
  }

  // Fuzzy match store names
  fuzzyMatchStore(dsrStoreName, cancellationStoreName) {
    if (!dsrStoreName || !cancellationStoreName) return false;
    
    const normalize = (str) => str.toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const dsr = normalize(dsrStoreName);
    const cancel = normalize(cancellationStoreName);
    
    // Exact match
    if (dsr === cancel) return true;
    
    // Contains match
    if (dsr.includes(cancel) || cancel.includes(dsr)) return true;
    
    // Keyword match (e.g., "edappal" matches "edapally")
    const getKeywords = (str) => normalize(str).split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['store', 'suit', 'suitor', 'guy'].includes(word));
    
    const dsrKeywords = getKeywords(dsrStoreName);
    const cancelKeywords = getKeywords(cancellationStoreName);
    
    for (const dsrWord of dsrKeywords) {
      for (const cancelWord of cancelKeywords) {
        if (dsrWord.includes(cancelWord) || cancelWord.includes(dsrWord)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Compare stores from DSR, cancellation data, and staff performance
  compareStores(dsrAnalysis, cancellationResult, staffPerformanceResult) {
    const criticalStores = [];
    const dsrOnlyStores = [];
    const cancellationOnlyStores = [];
    
    // ✅ FIX: Add defensive checks for data structure
    if (!dsrAnalysis || typeof dsrAnalysis !== 'object') {
      console.error('❌ Invalid dsrAnalysis structure:', dsrAnalysis);
      return {
        criticalStores: [],
        dsrOnlyStores: [],
        cancellationOnlyStores: [],
        summary: {
          totalDSRStores: 0,
          totalCancellationStores: 0,
          totalStaffPerformanceStores: 0,
          criticalCount: 0
        }
      };
    }
    
    // Handle both field names: problemStores (old) and badPerformingStores (new)
    const dsrStores = dsrAnalysis.problemStores || dsrAnalysis.badPerformingStores || [];
    const cancellationStores = cancellationResult?.analysis?.storeWiseProblems || {};
    const staffPerformanceStores = staffPerformanceResult?.analysis?.storeWisePerformance || {};
    
    console.log(`\n🔍 Comparing ${dsrStores.length} DSR problem stores with ${Object.keys(cancellationStores).length} cancellation stores and ${Object.keys(staffPerformanceStores).length} staff performance stores...`);
    
    // Find stores with DSR problems and match with cancellation & staff performance data
    dsrStores.forEach(dsrStore => {
      const storeName = dsrStore.storeName || dsrStore.name;
      let matchedCancellationStore = null;
      let matchedCancellationStoreName = null;
      let matchedStaffPerformanceStore = null;
      let matchedStaffPerformanceStoreName = null;
      
      // Try to find matching cancellation store
      for (const [cancelStore, cancelData] of Object.entries(cancellationStores)) {
        if (this.fuzzyMatchStore(storeName, cancelStore)) {
          matchedCancellationStore = cancelData;
          matchedCancellationStoreName = cancelStore;
          console.log(`✓ CANCELLATION MATCH: "${storeName}" → "${cancelStore}"`);
          break;
        }
      }
      
      // Try to find matching staff performance store
      for (const [staffStore, staffData] of Object.entries(staffPerformanceStores)) {
        if (this.fuzzyMatchStore(storeName, staffStore)) {
          matchedStaffPerformanceStore = staffData;
          matchedStaffPerformanceStoreName = staffStore;
          console.log(`✓ STAFF PERFORMANCE MATCH: "${storeName}" → "${staffStore}"`);
          break;
        }
      }
      
      if (matchedCancellationStore && matchedCancellationStore.totalCancellations > 0) {
        // Store has BOTH problems - CRITICAL!
        criticalStores.push({
          storeName: storeName,
          cancellationStoreName: matchedCancellationStoreName,
          staffPerformanceStoreName: matchedStaffPerformanceStoreName,
          dsrData: dsrStore,
          cancellationData: matchedCancellationStore,
          staffPerformanceData: matchedStaffPerformanceStore || null
        });
      } else {
        // Store has only DSR problems
        dsrOnlyStores.push({
          ...dsrStore,
          staffPerformanceData: matchedStaffPerformanceStore || null
        });
      }
    });
    
    // Find stores with ONLY cancellations (good DSR performance)
    Object.entries(cancellationStores).forEach(([cancelStore, cancelData]) => {
      const alreadyMatched = criticalStores.some(cs => cs.cancellationStoreName === cancelStore);
      if (!alreadyMatched && cancelData.totalCancellations > 0) {
        // Try to find staff performance for this store
        let matchedStaffPerformanceStore = null;
        for (const [staffStore, staffData] of Object.entries(staffPerformanceStores)) {
          if (this.fuzzyMatchStore(cancelStore, staffStore)) {
            matchedStaffPerformanceStore = staffData;
            break;
          }
        }
        
        cancellationOnlyStores.push({
          storeName: cancelStore,
          cancellationData: cancelData,
          staffPerformanceData: matchedStaffPerformanceStore || null
        });
      }
    });
    
    console.log(`\n📊 Results:`);
    console.log(`   🚨 Critical Stores (Both Issues): ${criticalStores.length}`);
    console.log(`   📈 DSR Only: ${dsrOnlyStores.length}`);
    console.log(`   ❌ Cancellation Only: ${cancellationOnlyStores.length}\n`);
    
    return {
      criticalStores,
      dsrOnlyStores,
      cancellationOnlyStores,
      summary: {
        totalDSRStores: dsrStores.length,
        totalCancellationStores: Object.keys(cancellationStores).length,
        totalStaffPerformanceStores: Object.keys(staffPerformanceStores).length,
        criticalCount: criticalStores.length
      }
    };
  }

  // Generate AI-powered action plans for each store
  async generateAIActionPlan(storeName, dsrIssues, cancellationReasons, dsrLoss, cancellationCount, problemType, dsrData = null, staffPerformanceData = null) {
    const prompt = this.buildActionPlanPrompt(storeName, dsrIssues, cancellationReasons, dsrLoss, cancellationCount, problemType, dsrData, staffPerformanceData);
    const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
    
    // Try Groq first
    if (GROQ_API_KEY) {
      try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a retail business consultant specializing in costume rental business. Provide actionable, CEO-level strategic advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }, {
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const aiResponse = response.data.choices[0].message.content;
      
      console.log(`\n${'='.repeat(80)}`);
        console.log(`🤖 AI ACTION PLAN GENERATED FOR: ${storeName} (via Groq)`);
      console.log(`${'='.repeat(80)}`);
      console.log('📥 FULL AI RESPONSE:');
      console.log(aiResponse);
      console.log(`${'='.repeat(80)}\n`);
      
      // Parse AI response
      const parsed = this.parseAIActionPlan(aiResponse);
      
      console.log('✅ PARSED ACTION PLAN:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log(`${'='.repeat(80)}\n`);
      
      return parsed;
      
      } catch (groqError) {
        console.error(`\n❌ Groq Action Plan generation FAILED for ${storeName}`);
        console.error(`❌ Error: ${groqError.message}`);
        console.error(`❌ Status: ${groqError.response?.status}`);
        
        // If rate limit or error, try Gemini
        if (GEMINI_API_KEY && groqError.response?.status === 429) {
          console.log(`🔄 Groq rate limited, switching to Google Gemini...\n`);
          // Continue to Gemini below
        } else {
          throw groqError; // Re-throw if not rate limit or no Gemini key
        }
      }
    }
    
    // Try Google Gemini (if Groq failed or no Groq key)
    if (GEMINI_API_KEY) {
      try {
        console.log(`📨 Generating action plan via Google Gemini for ${storeName}...`);
        
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `You are a retail business consultant specializing in costume rental business. Provide actionable, CEO-level strategic advice.\n\n${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4000
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 40000
          }
        );

        const aiResponse = response.data.candidates[0].content.parts[0].text;
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🤖 AI ACTION PLAN GENERATED FOR: ${storeName} (via Gemini)`);
        console.log(`${'='.repeat(80)}`);
        console.log('📥 FULL AI RESPONSE:');
        console.log(aiResponse);
        console.log(`${'='.repeat(80)}\n`);
        
        // Parse AI response
        const parsed = this.parseAIActionPlan(aiResponse);
        
        console.log('✅ PARSED ACTION PLAN:');
        console.log(JSON.stringify(parsed, null, 2));
        console.log(`${'='.repeat(80)}\n`);
        
        return parsed;
        
      } catch (geminiError) {
        console.error(`\n❌ Gemini Action Plan generation FAILED for ${storeName}`);
        console.error(`❌ Error: ${geminiError.message}`);
      console.error(`❌ Falling back to rule-based plan...\n`);
        // Continue to fallback below
      }
    }
      
    // Fallback to rule-based plan (if both APIs failed)
      const fallbackPlan = this.generateActionPlanForStore(storeName, dsrIssues, cancellationReasons, dsrLoss, cancellationCount, problemType);
      
      console.log('📋 FALLBACK PLAN GENERATED:');
      console.log(JSON.stringify(fallbackPlan, null, 2));
      console.log(`${'─'.repeat(80)}\n`);
      
      return fallbackPlan;
  }

  // Build AI prompt for action plan with detailed DSR, cancellation, and staff performance data
  buildActionPlanPrompt(storeName, dsrIssues, cancellationReasons, dsrLoss, cancellationCount, problemType, dsrData, staffPerformanceData) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📝 BUILDING DETAILED AI PROMPT FOR: ${storeName}`);
    console.log(`${'─'.repeat(80)}`);
    
    let prompt = `You are a CEO analyzing ${storeName}, a costume rental store in Kerala, India.\n\n`;
    
    if (problemType === 'BOTH') {
      prompt += `⚠️ CRITICAL SITUATION: This store has BOTH poor sales performance AND high cancellations.\n\n`;
      
      prompt += `📊 DETAILED DSR PERFORMANCE ANALYSIS:\n`;
      prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      if (dsrData) {
        prompt += `• Conversion Rate: ${dsrData.conversionRate || 'N/A'}\n`;
        prompt += `• Bills Performance: ${dsrData.billsPerformance || 'N/A'}\n`;
        prompt += `• Quantity Performance: ${dsrData.quantityPerformance || 'N/A'}\n`;
        prompt += `• Loss of Sale: ${dsrData.lossOfSale || 'N/A'}\n`;
        prompt += `• ABS Value: ₹${dsrData.absValue || 'N/A'}\n`;
      }
      prompt += `💰 Estimated Revenue Loss: ₹${dsrLoss.toLocaleString()}\n`;
      prompt += `\n🔍 Root Causes:\n`;
      dsrIssues.forEach((issue, i) => {
        prompt += `   ${i + 1}. ${issue}\n`;
      });
      
      prompt += `\n❌ CANCELLATION ANALYSIS:\n`;
      prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      prompt += `• Total Cancellations: ${cancellationCount}\n`;
      prompt += `• Cancellation Rate: ${((cancellationCount / (dsrData?.walkIns || 1)) * 100).toFixed(2)}% of walk-ins\n`;
      prompt += `\n📋 Top Cancellation Reasons:\n`;
      cancellationReasons.forEach((reason, i) => {
        prompt += `   ${i + 1}. ${reason.reason}\n`;
        prompt += `      • Frequency: ${reason.count} times (${reason.percentage}%)\n`;
        prompt += `      • Impact: ${reason.count > 2 ? 'HIGH' : reason.count > 1 ? 'MEDIUM' : 'LOW'}\n`;
      });
      
      // Add staff performance data if available
      if (staffPerformanceData) {
        prompt += `\n👥 STAFF PERFORMANCE ANALYSIS:\n`;
        prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prompt += `• Store Conversion Rate: ${staffPerformanceData.conversionRate}%\n`;
        prompt += `• Performance Status: ${staffPerformanceData.performanceStatus}\n`;
        prompt += `• Bills: ${staffPerformanceData.bills}\n`;
        prompt += `• Quantity: ${staffPerformanceData.quantity}\n`;
        prompt += `• Loss of Sale: ${staffPerformanceData.lossOfSale}\n`;
        prompt += `• Staff Count: ${staffPerformanceData.staffCount}\n`;
        
        if (staffPerformanceData.staffIssues && staffPerformanceData.staffIssues.length > 0) {
          prompt += `\n⚠️ Identified Staff Issues:\n`;
          staffPerformanceData.staffIssues.forEach((issue, i) => {
            prompt += `   ${i + 1}. ${issue}\n`;
          });
        }
        
        if (staffPerformanceData.staffDetails && staffPerformanceData.staffDetails.length > 0) {
          prompt += `\n👤 Individual Staff Performance:\n`;
          staffPerformanceData.staffDetails.forEach((staff, i) => {
            prompt += `   ${i + 1}. ${staff.name}\n`;
            prompt += `      • Conversion: ${staff.conversionRate}%\n`;
            prompt += `      • Bills: ${staff.bills}\n`;
            prompt += `      • Loss of Sale: ${staff.lossOfSale}\n`;
          });
        }
        
        // Add attendance issues if available
        if (staffPerformanceData.attendance && staffPerformanceData.attendance.totalIssues > 0) {
          prompt += `\n🚨 ATTENDANCE ISSUES ON DSR DATE (${dsrData?.walkIns || 'Day'} Walk-ins Day):\n`;
          prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          prompt += `⚠️ CRITICAL: ${staffPerformanceData.attendance.totalIssues} staff members were NOT working on DSR date!\n\n`;
          
          if (staffPerformanceData.attendance.absentCount > 0) {
            prompt += `• ABSENT (A): ${staffPerformanceData.attendance.absentCount} employees\n`;
            staffPerformanceData.attendance.absentEmployees.forEach(emp => {
              prompt += `   - ${emp.name} (${emp.designation})\n`;
            });
          }
          
          if (staffPerformanceData.attendance.lopCount > 0) {
            prompt += `• LOSS OF PAY (LOP): ${staffPerformanceData.attendance.lopCount} employees\n`;
            staffPerformanceData.attendance.lopEmployees.forEach(emp => {
              prompt += `   - ${emp.name} (${emp.designation})\n`;
            });
          }
          
          if (staffPerformanceData.attendance.leaveCount > 0) {
            prompt += `• ON LEAVE (L/AL): ${staffPerformanceData.attendance.leaveCount} employees\n`;
            staffPerformanceData.attendance.leaveEmployees.forEach(emp => {
              prompt += `   - ${emp.name} (${emp.designation})\n`;
            });
          }
          
          if (staffPerformanceData.attendance.halfDayCount > 0) {
            prompt += `• HALF DAY (H/D): ${staffPerformanceData.attendance.halfDayCount} employees\n`;
            staffPerformanceData.attendance.halfDayEmployees.forEach(emp => {
              prompt += `   - ${emp.name} (${emp.designation})\n`;
            });
          }
          
          const totalMissingStaff = staffPerformanceData.attendance.absentCount + 
                                   staffPerformanceData.attendance.lopCount + 
                                   staffPerformanceData.attendance.leaveCount;
          
          const staffingLevel = staffPerformanceData.staffCount - totalMissingStaff;
          prompt += `\n⚠️ STAFFING IMPACT:\n`;
          prompt += `   • Expected Staff: ${staffPerformanceData.staffCount}\n`;
          prompt += `   • Actually Working: ${staffingLevel} (${totalMissingStaff} missing)\n`;
          prompt += `   • Staffing Level: ${staffingLevel > 0 ? ((staffingLevel / staffPerformanceData.staffCount) * 100).toFixed(0) : 0}% capacity\n`;
        }
        
        // Add loss of sale information if available
        if (staffPerformanceData.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
          prompt += `\n📉 LOSS OF SALE DETAILS (${staffPerformanceData.lossOfSaleDetails.totalLost} Lost Customers):\n`;
          prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          prompt += `⚠️ CRITICAL: ${staffPerformanceData.lossOfSaleDetails.totalLost} customers walked away without buying!\n\n`;
          
          // Show top reasons
          if (staffPerformanceData.lossOfSaleDetails.topReasons && staffPerformanceData.lossOfSaleDetails.topReasons.length > 0) {
            prompt += `📋 Top Reasons for Lost Sales:\n`;
            staffPerformanceData.lossOfSaleDetails.topReasons.forEach((reason, idx) => {
              prompt += `   ${idx + 1}. ${reason.reason}: ${reason.count} cases\n`;
            });
          }
          
          // Show what customers wanted (from "Other Comments" column H)
          const customerNeeds = staffPerformanceData.lossOfSaleDetails.entries
            .filter(entry => entry.otherComments && entry.otherComments.trim())
            .slice(0, 5);
          
          if (customerNeeds.length > 0) {
            prompt += `\n🎯 WHAT CUSTOMERS WANTED (But we didn't have):\n`;
            customerNeeds.forEach((entry, idx) => {
              prompt += `   ${idx + 1}. ${entry.otherComments}`;
              if (entry.productUnavailability && entry.productUnavailability.trim()) {
                prompt += ` [Missing: ${entry.productUnavailability}]`;
              }
              prompt += `\n`;
            });
          }
          
          // Show product unavailability details (from column I)
          const productGaps = staffPerformanceData.lossOfSaleDetails.entries
            .filter(entry => entry.productUnavailability && entry.productUnavailability.trim())
            .slice(0, 5);
          
          if (productGaps.length > 0) {
            prompt += `\n❌ PRODUCT UNAVAILABILITY ISSUES:\n`;
            productGaps.forEach((entry, idx) => {
              prompt += `   ${idx + 1}. ${entry.productUnavailability} (Customer: ${entry.customerName})\n`;
            });
          }
          
          prompt += `\n💰 IMPACT OF LOST SALES:\n`;
          prompt += `   • ${staffPerformanceData.lossOfSaleDetails.totalLost} customers lost = Potential revenue loss\n`;
          prompt += `   • Conversion rate impacted: ${staffPerformanceData.conversionRate}%\n`;
          prompt += `   • These losses are PREVENTABLE with proper inventory and product variety!\n`;
        }
        
        prompt += `\n🔍 ROOT CAUSE ANALYSIS:\n`;
        
        // Check if loss of sale is a factor
        if (staffPerformanceData.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
          const lossPercentage = ((staffPerformanceData.lossOfSaleDetails.totalLost / (staffPerformanceData.walkIns || 1)) * 100).toFixed(1);
          
          if (staffPerformanceData.lossOfSaleDetails.totalLost >= 3 || parseFloat(lossPercentage) > 15) {
            prompt += `🚨 LOSS OF SALE IS A MAJOR ROOT CAUSE!\n`;
            prompt += `   • ${staffPerformanceData.lossOfSaleDetails.totalLost} customers lost (${lossPercentage}% of walk-ins)\n`;
            prompt += `   • PRIMARY ISSUES:\n`;
            
            // Check for product unavailability
            const productGaps = staffPerformanceData.lossOfSaleDetails.entries
              .filter(entry => entry.productUnavailability && entry.productUnavailability.trim()).length;
            
            if (productGaps > 0) {
              prompt += `      - INVENTORY GAP: ${productGaps} cases of product unavailability\n`;
              prompt += `      - Customers are ASKING for products we don't stock!\n`;
            }
            
            // Check for common reasons
            if (staffPerformanceData.lossOfSaleDetails.topReasons) {
              const sizeIssues = staffPerformanceData.lossOfSaleDetails.topReasons.filter(r => 
                r.reason.toLowerCase().includes('size')).reduce((sum, r) => sum + r.count, 0);
              
              if (sizeIssues > 0) {
                prompt += `      - SIZE AVAILABILITY: ${sizeIssues} cases of size not available\n`;
              }
            }
            
            prompt += `   • THIS IS PREVENTABLE: Stock the products customers are asking for!\n\n`;
          } else if (staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
            prompt += `⚠️ LOSS OF SALE is a CONTRIBUTING factor (${staffPerformanceData.lossOfSaleDetails.totalLost} customers lost)\n\n`;
          }
        }
        
        // Check if attendance is a factor
        if (staffPerformanceData.attendance && staffPerformanceData.attendance.totalIssues > 0) {
          const totalMissing = staffPerformanceData.attendance.absentCount + 
                              staffPerformanceData.attendance.lopCount + 
                              staffPerformanceData.attendance.leaveCount;
          
          if (totalMissing >= 2) {
            prompt += `🚨 ATTENDANCE IS A MAJOR ROOT CAUSE!\n`;
            prompt += `   • ${totalMissing} staff members were absent/LOP/leave on DSR date\n`;
            prompt += `   • This likely caused the high loss of sale (${staffPerformanceData.lossOfSale?.totalLost || 'some customers lost'})\n`;
            prompt += `   • Insufficient staff to handle ${staffPerformanceData.walkIns || 'walk-in'} customers\n`;
            prompt += `   • PRIMARY ISSUE: Poor staffing on DSR date, not staff performance\n\n`;
          } else if (totalMissing === 1) {
            prompt += `⚠️ ATTENDANCE is a CONTRIBUTING factor (1 staff missing)\n\n`;
          }
        }
        
        if (parseFloat(staffPerformanceData.conversionRate) < 60) {
          // Check if low conversion is due to loss of sale (inventory) or staff performance
          const hasInventoryIssues = staffPerformanceData.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 2;
          const hasAttendanceIssues = staffPerformanceData.attendance && staffPerformanceData.attendance.totalIssues > 0;
          
          if (hasInventoryIssues) {
            prompt += `⚠️ Low conversion (${staffPerformanceData.conversionRate}%) is PRIMARILY due to INVENTORY GAPS.\n`;
            prompt += `Staff are trying, but we don't have what customers want!\n`;
          } else if (hasAttendanceIssues) {
            prompt += `⚠️ Low conversion (${staffPerformanceData.conversionRate}%) is PRIMARILY due to POOR STAFFING.\n`;
            prompt += `Not enough staff to handle customer traffic!\n`;
          } else {
            prompt += `⚠️ STAFF PERFORMANCE is a MAJOR CONTRIBUTOR to low DSR performance.\n`;
            prompt += `The store's ${staffPerformanceData.conversionRate}% conversion rate indicates staff training/motivation issues.\n`;
          }
        } else {
          prompt += `Staff performance is acceptable (${staffPerformanceData.conversionRate}%).\n`;
          
          if (staffPerformanceData.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
            prompt += `However, ${staffPerformanceData.lossOfSaleDetails.totalLost} customers were lost due to inventory/product issues.\n`;
          } else {
            prompt += `Low DSR performance likely caused by other factors (pricing, competition).\n`;
          }
        }
      }
      
    } else if (problemType === 'CANCELLATION_ONLY') {
      prompt += `✅ DSR Performance: GOOD (Sales targets being met)\n`;
      prompt += `⚠️ Issue: High Cancellations Despite Good Sales Performance\n\n`;
      
      prompt += `❌ DETAILED CANCELLATION ANALYSIS:\n`;
      prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      prompt += `• Total Cancellations: ${cancellationCount}\n`;
      prompt += `• Store Status: Meeting DSR targets but losing customers\n`;
      prompt += `\n📋 Cancellation Breakdown:\n`;
      cancellationReasons.forEach((reason, i) => {
        prompt += `   ${i + 1}. ${reason.reason} - ${reason.count} times (${reason.percentage}%)\n`;
      });
      
      // Add staff performance for cancellation-only stores
      if (staffPerformanceData) {
        prompt += `\n👥 STAFF PERFORMANCE ANALYSIS:\n`;
        prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prompt += `• Store Conversion Rate: ${staffPerformanceData.conversionRate}%\n`;
        prompt += `• Performance Status: ${staffPerformanceData.performanceStatus}\n`;
        prompt += `• Walk-ins: ${staffPerformanceData.walkIns}\n`;
        prompt += `• Bills: ${staffPerformanceData.bills}\n`;
        prompt += `• Loss of Sale: ${staffPerformanceData.lossOfSale}\n`;
        prompt += `• Staff Count: ${staffPerformanceData.staffCount}\n`;
        
        if (staffPerformanceData.staffIssues && staffPerformanceData.staffIssues.length > 0) {
          prompt += `\n⚠️ Staff Issues: ${staffPerformanceData.staffIssues.length} identified\n`;
        }
        
        prompt += `\n🔍 ROOT CAUSE ANALYSIS:\n`;
        const convRate = parseFloat(staffPerformanceData.conversionRate);
        if (convRate < 60) {
          prompt += `⚠️ COMBINATION: DSR is good overall, BUT staff performance is POOR (${staffPerformanceData.conversionRate}%).\n`;
          prompt += `Root cause is BOTH cancellations AND staff performance issues.\n`;
          prompt += `Primary focus: Fix staff performance first, then address cancellations.\n`;
        } else if (convRate >= 70) {
          prompt += `✅ Staff performing well (${staffPerformanceData.conversionRate}%).\n`;
          prompt += `Root cause is CANCELLATIONS ONLY - not staff related.\n`;
          prompt += `Primary focus: Fix cancellation issues (inventory, policies, customer experience).\n`;
        } else {
          prompt += `⚠️ Staff performance is AVERAGE (${staffPerformanceData.conversionRate}%).\n`;
          prompt += `Root cause is primarily CANCELLATIONS, but staff could improve.\n`;
          prompt += `Primary focus: Fix cancellations, secondary: improve staff conversion.\n`;
        }
      } else {
        prompt += `\n⚠️ No staff performance data available for this store.\n`;
        prompt += `Root cause: CANCELLATIONS (staff data unavailable for comparison).\n`;
      }
    } else if (problemType === 'DSR_ONLY') {
      prompt += `📊 DSR Performance: POOR (Below targets)\n`;
      prompt += `✅ Cancellations: NONE (0 cancellations - customer retention is good)\n\n`;
      
      prompt += `📊 DETAILED DSR PERFORMANCE ANALYSIS:\n`;
    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      if (dsrData) {
        prompt += `• Conversion Rate: ${dsrData.conversionRate || 'N/A'}\n`;
        prompt += `• Bills Performance: ${dsrData.billsPerformance || 'N/A'}\n`;
        prompt += `• Quantity Performance: ${dsrData.quantityPerformance || 'N/A'}\n`;
        prompt += `• Loss of Sale: ${dsrData.lossOfSale || 'N/A'}\n`;
        prompt += `• ABS (Avg Bill Size): ${dsrData.absValue || 'N/A'}\n`;
        prompt += `• ABV (Avg Bill Value): ${dsrData.abvValue || 'N/A'}\n`;
        prompt += `• Estimated Revenue Loss: ₹${dsrLoss.toLocaleString()}\n\n`;
      }
      
      prompt += `📋 DSR Issues:\n`;
      dsrIssues.forEach((issue, i) => {
        prompt += `   ${i + 1}. ${issue}\n`;
      });
      
      // Add staff performance for DSR-only stores
      if (staffPerformanceData) {
        prompt += `\n👥 STAFF PERFORMANCE ANALYSIS:\n`;
        prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prompt += `• Store Conversion Rate: ${staffPerformanceData.conversionRate}%\n`;
        prompt += `• Performance Status: ${staffPerformanceData.performanceStatus}\n`;
        prompt += `• Walk-ins: ${staffPerformanceData.walkIns}\n`;
        prompt += `• Bills: ${staffPerformanceData.bills}\n`;
        prompt += `• Quantity: ${staffPerformanceData.quantity || 'N/A'}\n`;
        prompt += `• Loss of Sale: ${staffPerformanceData.lossOfSale}\n`;
        prompt += `• Staff Count: ${staffPerformanceData.staffCount}\n`;
        
        if (staffPerformanceData.staffIssues && staffPerformanceData.staffIssues.length > 0) {
          prompt += `\n⚠️ Staff Issues Identified: ${staffPerformanceData.staffIssues.length}\n`;
          staffPerformanceData.staffIssues.slice(0, 3).forEach((issue, i) => {
            prompt += `   ${i + 1}. ${issue}\n`;
          });
        }
        
        if (staffPerformanceData.staffDetails && staffPerformanceData.staffDetails.length > 0) {
          prompt += `\n👤 Individual Staff Performance:\n`;
          staffPerformanceData.staffDetails.forEach((staff, i) => {
            prompt += `   ${i + 1}. ${staff.name}\n`;
            prompt += `      • Conversion: ${staff.conversionRate}%\n`;
            prompt += `      • Bills: ${staff.bills}\n`;
            prompt += `      • Loss of Sale: ${staff.lossOfSale}\n`;
          });
        }
        
        prompt += `\n🔍 ROOT CAUSE ANALYSIS:\n`;
        if (parseFloat(staffPerformanceData.conversionRate) < 60) {
          prompt += `⚠️ STAFF PERFORMANCE is the PRIMARY ROOT CAUSE.\n`;
          prompt += `The store's ${staffPerformanceData.conversionRate}% conversion rate indicates staff training/motivation issues.\n`;
          prompt += `With 0 cancellations, the problem is clearly in sales conversion, not customer satisfaction.\n`;
        } else {
          prompt += `Staff performance is acceptable (${staffPerformanceData.conversionRate}%).\n`;
          prompt += `Low DSR performance likely caused by other factors:\n`;
          prompt += `   - Inventory issues (check loss of sale: ${staffPerformanceData.lossOfSale})\n`;
          prompt += `   - Low walk-ins (${staffPerformanceData.walkIns}) - marketing/visibility issue\n`;
          prompt += `   - Pricing/competition issues\n`;
        }
      } else {
        prompt += `\n⚠️ No staff performance data available for this store.\n`;
        prompt += `Root cause: Unknown (need to investigate DSR issues manually).\n`;
      }
    }
    
    prompt += `\n🎯 ROOT CAUSE DIAGNOSIS RULES:\n`;
    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    prompt += `Use these business logic rules to identify the root cause:\n\n`;
    prompt += `IF YOU FIND:                          → ROOT CAUSE IS:\n`;
    prompt += `• High walk-ins + low conversion      → Staff follow-up / poor selling skill\n`;
    prompt += `• Low walk-ins + normal conversion    → Marketing or visibility issue\n`;
    prompt += `• High loss of sale with size issue   → Inventory planning issue\n`;
    prompt += `• High cancellations for same reason  → Process/policy issue\n`;
    prompt += `• Staff conversion < 60%              → Staff training urgently needed\n`;
    prompt += `• Staff conversion >= 70%             → Problem is NOT staff (check inventory/competition)\n\n`;
    
    prompt += `\n🎯 YOUR CEO-LEVEL TASK:\n`;
    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    prompt += `Provide a SIMPLE, CLEAR, ACTIONABLE plan in JSON format:\n\n`;
    
    prompt += `1. "rootCause": One clear sentence identifying THE PRIMARY root cause:\n`;
    prompt += `   - Use the diagnosis rules above\n`;
    prompt += `   - Be specific: Is it STAFF? CANCELLATIONS? INVENTORY? MARKETING? or COMBINATION?\n`;
    prompt += `   Example: "PRIMARY ROOT CAUSE: Staff follow-up issue (conversion only 45%) + high cancellations due to inventory problems"\n\n`;
    
    prompt += `2. "rootCauseCategory": Pick ONE from: "STAFF_PERFORMANCE", "CANCELLATIONS", "INVENTORY", "MARKETING", "COMBINATION"\n\n`;
    
    prompt += `3. "immediate": Array of EXACTLY 4 DATA-DRIVEN URGENT actions for 24-48 hours:\n`;
    prompt += `   ⚠️ MUST BE SPECIFIC WITH NUMBERS FROM THE DATA ABOVE:\n`;
    prompt += `   ❌ BAD: "Manager: Meet with staff today"\n`;
    prompt += `   ✅ GOOD: "Manager: Review ${staffPerformanceData?.staffCount || 0} staff members' ${staffPerformanceData?.lossOfSale || 0} lost sales today"\n`;
    prompt += `   ❌ BAD: "Call cancelled customers"\n`;
    prompt += `   ✅ GOOD: "Call ${cancellationCount} cancelled customers about ${cancellationReasons[0]?.reason || 'issues'} (main reason: ${cancellationReasons[0]?.count || 0} cases)"\n`;
    
    // Add loss of sale specific requirements
    if (staffPerformanceData?.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
      prompt += `   \n   🚨 LOSS OF SALE REQUIREMENT:\n`;
      prompt += `   • At least 1-2 immediate actions MUST address the ${staffPerformanceData.lossOfSaleDetails.totalLost} lost customers\n`;
      prompt += `   • Reference the SPECIFIC products customers wanted (from "What Customers Wanted" section)\n`;
      prompt += `   • Example: "Check inventory for 'grey suit' and 'double breasted suit' requested by lost customers"\n`;
      prompt += `   • Example: "Call ${staffPerformanceData.lossOfSaleDetails.totalLost} lost customers to understand their needs"\n`;
    }
    
    prompt += `   - Use ACTUAL NUMBERS and SPECIFIC REASONS from data\n`;
    prompt += `   - Mention EXACT staff names if provided\n`;
    prompt += `   - Reference SPECIFIC problems (conversion %, walk-ins count, cancellation reasons)\n\n`;
    
    prompt += `4. "shortTerm": Array of EXACTLY 4 CONCRETE tactical actions for 1-2 weeks:\n`;
    prompt += `   - Address the EXACT root cause with measurable steps\n`;
    prompt += `   ❌ BAD: "Improve staff training"\n`;
    prompt += `   ✅ GOOD: "Train ${staffPerformanceData?.staffCount || 'all'} staff to improve conversion from ${staffPerformanceData?.conversionRate || 0}% to 65%"\n`;
    
    // Add loss of sale specific requirements
    if (staffPerformanceData?.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
      prompt += `   \n   🚨 LOSS OF SALE REQUIREMENT:\n`;
      prompt += `   • At least 1-2 short-term actions MUST reduce the ${staffPerformanceData.lossOfSaleDetails.totalLost} lost customers\n`;
      prompt += `   • Stock the SPECIFIC products customers wanted (reference "What Customers Wanted" section)\n`;
      prompt += `   • Set MEASURABLE targets: "Reduce loss of sale from ${staffPerformanceData.lossOfSaleDetails.totalLost} to 0 by stocking requested products within 2 weeks"\n`;
      prompt += `   • Address product unavailability issues mentioned in the data\n`;
    }
    
    prompt += `   - Include TARGET numbers (conversion %, sales targets, timeframes)\n\n`;
    
    prompt += `5. "longTerm": Array of EXACTLY 4 STRATEGIC actions for 1-3 months:\n`;
    prompt += `   - System-level improvements with MEASURABLE goals\n`;
    prompt += `   ❌ BAD: "Implement customer loyalty program"\n`;
    prompt += `   ✅ GOOD: "Launch loyalty program targeting ${staffPerformanceData?.walkIns || 0} monthly walk-ins to reduce ${cancellationCount} cancellations"\n`;
    
    // Add loss of sale specific requirements
    if (staffPerformanceData?.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
      prompt += `   \n   🚨 LOSS OF SALE REQUIREMENT:\n`;
      prompt += `   • At least 1 long-term action MUST create a system to prevent future loss of sales\n`;
      prompt += `   • Example: "Implement inventory management system tracking customer requests to prevent ${staffPerformanceData.lossOfSaleDetails.totalLost} lost sales monthly"\n`;
      prompt += `   • Example: "Create customer needs database from ${staffPerformanceData.lossOfSaleDetails.totalLost} lost customer records to guide procurement"\n`;
      prompt += `   • Focus on PREVENTING similar losses in the future\n`;
    }
    
    prompt += `   - Include SPECIFIC metrics and targets\n\n`;
    
    prompt += `6. "expectedImpact": One sentence with specific numbers:\n`;
    if (problemType === 'BOTH') {
      const lossOfSaleImpact = staffPerformanceData?.lossOfSaleDetails?.totalLost > 0 
        ? `, reduce loss of sale from ${staffPerformanceData.lossOfSaleDetails.totalLost} to 0` 
        : '';
      prompt += `   Example: "Reduce cancellations by 40% (${Math.round(cancellationCount * 0.4)} fewer), recover ₹${Math.round(dsrLoss * 0.6).toLocaleString()}${lossOfSaleImpact}, improve conversion to 70% in 2 months"\n\n`;
    } else if (problemType === 'DSR_ONLY') {
      const lossOfSaleImpact = staffPerformanceData?.lossOfSaleDetails?.totalLost > 0 
        ? `, reduce loss of sale from ${staffPerformanceData.lossOfSaleDetails.totalLost} to 0` 
        : '';
      prompt += `   Example: "Improve conversion to 70%, recover ₹${Math.round(dsrLoss * 0.6).toLocaleString()}${lossOfSaleImpact}, increase ABV by 20% in 2 months"\n\n`;
    } else {
      prompt += `   Example: "Reduce cancellations by 40% (${Math.round(cancellationCount * 0.4)} fewer), recover ₹500, improve retention in 2 months"\n\n`;
    }
    
    prompt += `⚠️ CRITICAL REQUIREMENTS - ACTION PLANS MUST BE DATA-DRIVEN:\n`;
    prompt += `• ALWAYS use ACTUAL NUMBERS from the data (walk-ins, conversion %, staff count, cancellation count)\n`;
    prompt += `• ALWAYS reference SPECIFIC staff names when provided in data\n`;
    prompt += `• ALWAYS mention EXACT cancellation reasons from the data\n`;
    
    // Add loss of sale specific requirements
    if (staffPerformanceData?.lossOfSaleDetails && staffPerformanceData.lossOfSaleDetails.totalLost > 0) {
      prompt += `\n🚨 LOSS OF SALE CRITICAL REQUIREMENTS:\n`;
      prompt += `• MUST address the ${staffPerformanceData.lossOfSaleDetails.totalLost} lost customers in your action plans\n`;
      prompt += `• MUST reference SPECIFIC products from "What Customers Wanted" section\n`;
      prompt += `• MUST create actions to STOCK those specific products\n`;
      prompt += `• MUST include measurable targets to REDUCE loss of sale to 0\n`;
      prompt += `• Example: "Stock 'grey suit' and 'double breasted suit' requested by ${staffPerformanceData.lossOfSaleDetails.totalLost} lost customers within 5 days"\n\n`;
    }
    
    prompt += `• NEVER use generic phrases like "meet with staff" or "improve performance"\n`;
    prompt += `• INSTEAD say: "Review John's 45% conversion (${staffPerformanceData?.bills || 0} bills from ${staffPerformanceData?.walkIns || 0} walk-ins)"\n`;
    prompt += `• Include SPECIFIC METRICS: "Reduce loss of sale from ${staffPerformanceData?.lossOfSale || 0} to 5 by fixing size availability"\n`;
    prompt += `• Make actions MEASURABLE and TRACKABLE\n`;
    prompt += `• Keep each action under 20 words but PACKED with specifics\n`;
    prompt += `• EXACTLY 4 actions per category (not more, not less)\n\n`;
    
    prompt += `Return ONLY valid JSON. No markdown, no explanations, no code blocks.`;
    
    console.log('📤 PROMPT SENT TO AI:');
    console.log(prompt);
    console.log(`${'─'.repeat(80)}\n`);
    
    return prompt;
  }

  // Parse AI response into structured format
  parseAIActionPlan(aiResponse) {
    try {
      // Clean the response
      let cleaned = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      // Find JSON object
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      
      const parsed = JSON.parse(cleaned);
      
      // Validate structure
      return {
        rootCause: parsed.rootCause || 'Root cause analysis pending',
        rootCauseCategory: parsed.rootCauseCategory || 'COMBINATION',
        immediate: parsed.immediate || [],
        shortTerm: parsed.shortTerm || [],
        longTerm: parsed.longTerm || [],
        expectedImpact: parsed.expectedImpact || 'Significant improvement expected'
      };
      
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message);
      throw error;
    }
  }

  // Helper function to get top loss of sale reasons for a store
  getTopLossReasons(lossEntries) {
    if (!lossEntries || lossEntries.length === 0) return [];
    
    const reasonCounts = {};
    lossEntries.forEach(entry => {
      const reason = entry.reason || 'Unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    return Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));
  }

  // Generate CEO-level action plans
  async generateCEOActionPlans(comparisonResult, cancellationResult, staffPerformanceResult, storeWalkIns = {}, attendanceResult = {}, lossOfSaleResult = {}) {
    const { criticalStores, dsrOnlyStores, cancellationOnlyStores } = comparisonResult;
    
    // Log walk-ins data
    console.log('\n👥 DSR Walk-Ins Data:');
    for (const [storeName, walkIns] of Object.entries(storeWalkIns)) {
      console.log(`   ${storeName}: ${walkIns} walk-ins`);
    }
    console.log('');
    
    // Log attendance data
    if (attendanceResult.success && attendanceResult.issues) {
      console.log('\n👥 Attendance Issues on DSR Date:');
      for (const [storeName, issues] of Object.entries(attendanceResult.issues.storeWiseIssues)) {
        console.log(`   ${storeName}: ${issues.totalIssues} issues`);
      }
      console.log('');
    }
    
    // Log loss of sale data
    if (lossOfSaleResult.success && lossOfSaleResult.groupedByStore) {
      console.log('\n📉 Loss of Sale Data on DSR Date:');
      for (const [storeName, lossEntries] of Object.entries(lossOfSaleResult.groupedByStore)) {
        console.log(`   ${storeName}: ${lossEntries.length} lost customers`);
        // Log top reasons for this store
        const storeReasons = lossOfSaleResult.data
          .filter(entry => entry.storeName === storeName)
          .map(entry => entry.reason);
        const reasonCounts = {};
        storeReasons.forEach(r => reasonCounts[r] = (reasonCounts[r] || 0) + 1);
        const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
        if (topReason) {
          console.log(`      Top reason: ${topReason[0]} (${topReason[1]} cases)`);
        }
      }
      console.log('');
    }
    
    // Helper function to recalculate staff performance with DSR walk-ins and attendance
    const recalculateStaffPerformance = (storeName, staffPerfData) => {
      if (!staffPerfData) {
        console.log(`   ⚠️ ${storeName}: No staff performance data available`);
        return null;
      }
      
      // Get attendance issues for this store
      let attendanceIssues = null;
      if (attendanceResult.success && attendanceResult.issues) {
        attendanceIssues = attendanceResult.issues.storeWiseIssues[storeName] || null;
      }
      
      // Get walk-ins from DSR sheet - try exact match first, then fuzzy match
      let walkIns = storeWalkIns[storeName];
      
      if (!walkIns) {
        // Try fuzzy matching if exact match fails
        const normalizedStoreName = storeName.toUpperCase().replace(/[^A-Z]/g, '');
        for (const [dsrStore, dsrWalkIns] of Object.entries(storeWalkIns)) {
          const normalizedDsrStore = dsrStore.toUpperCase().replace(/[^A-Z]/g, '');
          if (normalizedStoreName === normalizedDsrStore || 
              normalizedStoreName.includes(normalizedDsrStore) || 
              normalizedDsrStore.includes(normalizedStoreName)) {
            walkIns = dsrWalkIns;
            console.log(`   🔍 Fuzzy matched "${storeName}" to DSR store "${dsrStore}" (Walk-ins: ${walkIns})`);
            break;
          }
        }
      }
      
      // Default to 0 if still not found
      walkIns = walkIns || 0;
      
      const bills = staffPerfData.bills || 0;
      const lossOfSale = staffPerfData.lossOfSale || 0;
      
      // Calculate conversion rate: (Bills / Walk-ins) × 100
      const conversionRate = walkIns > 0 ? ((bills / walkIns) * 100).toFixed(2) : 0;
      
      // Determine performance status based on conversion rate
      let performanceStatus = 'UNKNOWN';
      if (conversionRate >= 70) performanceStatus = 'EXCELLENT';
      else if (conversionRate >= 60) performanceStatus = 'GOOD';
      else if (conversionRate >= 50) performanceStatus = 'AVERAGE';
      else if (conversionRate > 0) performanceStatus = 'POOR';
      
      console.log(`   📊 ${storeName}: Walk-ins=${walkIns}, Bills=${bills}, Conversion=${conversionRate}% (${performanceStatus})`);
      
      if (walkIns === 0) {
        console.log(`   ⚠️ WARNING: ${storeName} has 0 walk-ins from DSR! Check store name matching.`);
        console.log(`   Available DSR stores: ${Object.keys(storeWalkIns).join(', ')}`);
      }
      
      return {
        walkIns,
        bills,
        lossOfSale,  // ✅ Keep this as simple number for frontend display
        quantity: staffPerfData.quantity || 0,
        conversionRate,
        performanceStatus,
        staffCount: staffPerfData.staffCount || 0,
        staffIssues: staffPerfData.staffIssues || [],
        staffDetails: (staffPerfData.staffDetails || []).map(staff => ({
          name: staff.name,
          bills: staff.bills,
          lossOfSale: staff.lossOfSale,
          quantity: staff.quantity,
          // Calculate individual staff conversion (bills / (bills + loss))
          conversionRate: (staff.bills && staff.lossOfSale) 
            ? ((staff.bills / (staff.bills + staff.lossOfSale)) * 100).toFixed(2)
            : 'N/A'
        })),
        // ✅ FIX: Use fuzzy matching to find loss of sale data for this store
        lossOfSaleDetails: (() => {
          if (!lossOfSaleResult.success || !lossOfSaleResult.groupedByStore) return null;
          
          // Try direct match first
          if (lossOfSaleResult.groupedByStore[storeName]) {
            return {
              totalLost: lossOfSaleResult.groupedByStore[storeName].length,
              entries: lossOfSaleResult.groupedByStore[storeName],
              topReasons: this.getTopLossReasons(lossOfSaleResult.groupedByStore[storeName])
            };
          }
          
          // Store aliases for matching (same as lossOfSaleModel.js)
          const storeAliases = {
            'TRIVANDRUM': ['trivandrum', 'tvm', 'thiruvananthapuram', 'sg'],
            'MG ROAD': ['mgroad', 'mg', 'ernakulam'],
            'EDAPALLY': ['edapally', 'edappally', 'edapal'],
            'PERUMBAVOOR': ['perumbavoor', 'perumbavur', 'pmvr'],
            'KOTTAYAM': ['kottayam', 'ktm'],
            'THRISSUR': ['thrissur', 'trichur', 'tcr', 'trissur'],
            'PALAKKAD': ['palakkad', 'palghat', 'pkd'],
            'CHAVAKKAD': ['chavakkad', 'chavakad', 'chvkd'],
            'EDAPPAL': ['edappal', 'edapal'],
            'MANJERI': ['manjeri', 'manjery', 'mjr'],
            'PERINTHALMANNA': ['perinthalmanna', 'pmna', 'pma'],
            'KOTTAKKAL': ['kottakkal', 'kottakal', 'ktk'],
            'CALICUT': ['calicut', 'kozhikode', 'clct', 'clt'],
            'VADAKARA': ['vadakara', 'vadakkara', 'vdk', 'vatakara'],
            'KALPETTA': ['kalpetta', 'kalpeta', 'klp'],
            'KANNUR': ['kannur', 'cannanore', 'knr']
          };
          
          const normalizedInput = storeName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          
          // Try alias-based matching
          for (const [lossStoreName, lossEntries] of Object.entries(lossOfSaleResult.groupedByStore)) {
            const normalizedLoss = lossStoreName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            
            // Direct normalized match
            if (normalizedInput === normalizedLoss) {
              console.log(`   🔍 Fuzzy matched loss of sale: "${storeName}" → "${lossStoreName}" (${lossEntries.length} lost customers)`);
              return {
                totalLost: lossEntries.length,
                entries: lossEntries,
                topReasons: this.getTopLossReasons(lossEntries)
              };
            }
            
            // Check aliases
            for (const [canonicalName, aliases] of Object.entries(storeAliases)) {
              const matchesInput = aliases.some(alias => 
                normalizedInput === alias || normalizedInput.includes(alias) || alias.includes(normalizedInput)
              );
              const matchesLoss = aliases.some(alias => 
                normalizedLoss === alias || normalizedLoss.includes(alias) || alias.includes(normalizedLoss)
              );
              
              if (matchesInput && matchesLoss) {
                console.log(`   🔍 Fuzzy matched loss of sale (via alias): "${storeName}" → "${lossStoreName}" (${lossEntries.length} lost customers)`);
                return {
                  totalLost: lossEntries.length,
                  entries: lossEntries,
                  topReasons: this.getTopLossReasons(lossEntries)
                };
              }
            }
          }
          
          // Fallback: Try substring matching
          const normalizeStoreName = (name) => name.toUpperCase().replace(/[^A-Z]/g, '');
          const normalizedInputUpper = normalizeStoreName(storeName);
          
          for (const [lossStoreName, lossEntries] of Object.entries(lossOfSaleResult.groupedByStore)) {
            const normalizedLoss = normalizeStoreName(lossStoreName);
            if (normalizedInputUpper.includes(normalizedLoss) || 
                normalizedLoss.includes(normalizedInputUpper)) {
              console.log(`   🔍 Fuzzy matched loss of sale (substring): "${storeName}" → "${lossStoreName}" (${lossEntries.length} lost customers)`);
              return {
                totalLost: lossEntries.length,
                entries: lossEntries,
                topReasons: this.getTopLossReasons(lossEntries)
              };
            }
          }
          
          return null;
        })(),
        // Add attendance issues for this store
        attendance: attendanceIssues ? {
          totalIssues: attendanceIssues.totalIssues,
          absentCount: attendanceIssues.absentEmployees.length,
          lopCount: attendanceIssues.lopEmployees.length,
          leaveCount: attendanceIssues.leaveEmployees.length,
          halfDayCount: attendanceIssues.halfDayEmployees.length,
          absentEmployees: attendanceIssues.absentEmployees,
          lopEmployees: attendanceIssues.lopEmployees,
          leaveEmployees: attendanceIssues.leaveEmployees,
          halfDayEmployees: attendanceIssues.halfDayEmployees
        } : null
      };
    };
    
    console.log('\n📊 Recalculating Staff Performance with DSR Walk-ins:');
    
    // Process ALL stores with cancellations (critical + cancellation-only)
    const allStoresWithPlans = [];
    
    // TEMPORARY: Limit AI-generated plans to 4 worst stores, but show ALL stores with fallback plans
    const AI_PLAN_LIMIT = 4;
    const totalStores = criticalStores.length + cancellationOnlyStores.length + dsrOnlyStores.length;
    
    console.log(`\n${'🤖'.repeat(40)}`);
    console.log(`🤖 STARTING ACTION PLAN GENERATION FOR ALL STORES`);
    console.log(`🤖 Total Stores Found: ${totalStores}`);
    console.log(`🤖 Critical Stores (Poor DSR + Cancellations): ${criticalStores.length}`);
    console.log(`🤖 Cancellation-Only Stores (Good DSR + Cancellations): ${cancellationOnlyStores.length}`);
    console.log(`🤖 DSR-Only Stores (Poor DSR + No Cancellations): ${dsrOnlyStores.length}`);
    console.log(`💡 AI-POWERED PLANS: Top ${AI_PLAN_LIMIT} worst stores`);
    console.log(`📋 RULE-BASED PLANS: Remaining ${totalStores - AI_PLAN_LIMIT} stores`);
    console.log(`${'🤖'.repeat(40)}\n`);
    
    // Helper function to calculate "badness score" (higher = worse)
    const calculateBadnessScore = (store) => {
      const dsrData = store.dsrData || store;
      const convRate = parseFloat(dsrData.conversionRate || '100');
      const abs = parseFloat(dsrData.absValue || '2');
      const abv = parseFloat(dsrData.abvValue || '5000');
      
      // Calculate how far BELOW each threshold (higher = worse)
      const convBadness = Math.max(0, 80 - convRate);
      const absBadness = Math.max(0, (1.8 - abs) * 50);
      const abvBadness = Math.max(0, (4500 - abv) / 100);
      
      // Total badness score (higher = worse)
      // Weight: Conversion (70%), ABS (15%), ABV (15%)
      return (convBadness * 0.7) + (absBadness * 0.15) + (abvBadness * 0.15);
    };
    
    // Sort all store arrays by badness score (worst first)
    const sortByBadness = (stores) => {
      return stores.sort((a, b) => calculateBadnessScore(b) - calculateBadnessScore(a));
    };
    
    sortByBadness(criticalStores);
    sortByBadness(cancellationOnlyStores);
    sortByBadness(dsrOnlyStores);
    
    // NEW APPROACH: Combine ALL stores and sort by badness score regardless of category
    const allStoresWithScores = [
      ...criticalStores.map(s => ({ ...s, category: 'CRITICAL' })),
      ...cancellationOnlyStores.map(s => ({ ...s, category: 'CANCELLATION_ONLY' })),
      ...dsrOnlyStores.map(s => ({ ...s, category: 'DSR_ONLY' }))
    ];
    
    // Sort ALL stores by badness score (highest = worst)
    allStoresWithScores.sort((a, b) => calculateBadnessScore(b) - calculateBadnessScore(a));
    
    // Log top 10 worst stores for visibility
    console.log('🏆 TOP 10 WORST PERFORMING STORES (by badness score):');
    allStoresWithScores.slice(0, 10).forEach((store, idx) => {
      const score = calculateBadnessScore(store);
      const dsrData = store.dsrData || store;
      console.log(`   ${idx + 1}. ${store.storeName} - Score: ${score.toFixed(2)} (Conv: ${dsrData.conversionRate}%, ABS: ${dsrData.absValue}, ABV: ${dsrData.abvValue}) [${store.category}]`);
    });
    console.log('');
    
    // Select the TOP N WORST stores for AI-generated plans
    const topWorstStores = allStoresWithScores.slice(0, AI_PLAN_LIMIT);
    const remainingStores = allStoresWithScores.slice(AI_PLAN_LIMIT);
    
    console.log(`📊 AI-POWERED PLANS: Processing TOP ${AI_PLAN_LIMIT} WORST stores:\n`);
    topWorstStores.forEach((store, idx) => {
      const score = calculateBadnessScore(store);
      console.log(`   ${idx + 1}. ${store.storeName} (Score: ${score.toFixed(2)}, Category: ${store.category})`);
    });
    console.log('');
    
    if (remainingStores.length > 0) {
      console.log(`📋 RULE-BASED PLANS: Processing ${remainingStores.length} remaining stores:\n`);
      remainingStores.forEach((store, idx) => {
        const score = calculateBadnessScore(store);
        console.log(`   ${idx + 1}. ${store.storeName} (Score: ${score.toFixed(2)}, Category: ${store.category})`);
      });
      console.log('');
    }
    
    // Process TOP N WORST stores with AI-generated plans (regardless of category)
    for (let idx = 0; idx < topWorstStores.length; idx++) {
      const store = topWorstStores[idx];
      const category = store.category;
      
      // Process based on category
      if (category === 'CRITICAL') {
        // Critical store: both DSR + Cancellations
      const dsrData = store.dsrData;
      const cancelData = store.cancellationData;
      const staffPerfData = recalculateStaffPerformance(store.storeName, store.staffPerformanceData);
      
      const dsrIssues = dsrData.rootCauses || dsrData.issues || [dsrData.whyBadPerforming || 'Performance issues'];
      const dsrLoss = parseFloat(dsrData.revenueLoss || dsrData.totalLoss || dsrData.absValue || 0) || 0;
      const topCancellationReasons = cancelData.topReasons || [];
      
      const severity = dsrLoss > 250 && cancelData.totalCancellations > 5 ? 'CRITICAL' :
                      dsrLoss > 150 || cancelData.totalCancellations > 3 ? 'HIGH' : 'MEDIUM';
      
      console.log(`\n🚨 CRITICAL STORE ANALYSIS: ${store.storeName}`);
      console.log(`   DSR Loss: ₹${dsrLoss.toLocaleString()}`);
      console.log(`   Cancellations: ${cancelData.totalCancellations}`);
      console.log(`   DSR Issues: ${dsrIssues.join(', ')}`);
      console.log(`   Top Cancel Reasons: ${topCancellationReasons.map(r => r.reason).join(', ')}`);
      if (staffPerfData) {
        console.log(`   Staff Performance: ${staffPerfData.conversionRate}% (${staffPerfData.performanceStatus})`);
      }
      
      const actionPlan = await this.generateAIActionPlan(
        store.storeName,
        dsrIssues,
        topCancellationReasons,
        dsrLoss,
        cancelData.totalCancellations,
        'BOTH', // Has both problems
        dsrData, // Pass full DSR data for detailed analysis
        staffPerfData // Pass staff performance data
      );
      
      console.log(`✅ Action plan generated for ${store.storeName}\n`);
      
      // Add delay between AI calls
      if (idx < topWorstStores.length - 1) {
        console.log(`⏳ Waiting 2 seconds before next AI call to avoid rate limits...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      allStoresWithPlans.push({
        storeName: store.storeName,
        cancellationStoreName: store.cancellationStoreName,
        severity,
        dsrStatus: 'POOR',
        dsrIssues,
        dsrLoss,
        // Detailed DSR metrics
        dsrMetrics: {
          conversionRate: dsrData.conversionRate || 'N/A',
          billsPerformance: dsrData.billsPerformance || 'N/A',
          quantityPerformance: dsrData.quantityPerformance || 'N/A',
          walkIns: dsrData.walkIns || 'N/A',
          lossOfSale: dsrData.lossOfSale || 'N/A',
          absValue: dsrData.absValue || 'N/A',
          abvValue: dsrData.abvValue || 'N/A'
        },
        // Staff Performance metrics
        staffPerformance: staffPerfData ? {
          walkIns: staffPerfData.walkIns || 0, // ✅ ADDED: Walk-ins from DSR
          bills: staffPerfData.bills || 0,
          conversionRate: staffPerfData.conversionRate || 'N/A',
          performanceStatus: staffPerfData.performanceStatus || 'N/A',
          quantity: staffPerfData.quantity || 0,
          lossOfSale: staffPerfData.lossOfSale || 0,
          staffCount: staffPerfData.staffCount || 0,
          staffIssues: staffPerfData.staffIssues || [],
          staffDetails: staffPerfData.staffDetails || [],
          lossOfSaleDetails: staffPerfData.lossOfSaleDetails || null, // ✅ ADDED: Loss of sale details
          attendance: staffPerfData.attendance || null // ✅ ADDED: Attendance data
        } : null,
        totalCancellations: cancelData.totalCancellations,
        cancellationReasons: topCancellationReasons.slice(0, 3),
        actionPlan,
        problemType: 'BOTH'
      });
    
      } else if (category === 'CANCELLATION_ONLY') {
        // Cancellation-only store: Good DSR but has cancellations
      const cancelData = store.cancellationData;
      const staffPerfData = recalculateStaffPerformance(store.storeName, store.staffPerformanceData);
      const topCancellationReasons = cancelData.topReasons || [];
      
      const severity = cancelData.totalCancellations > 5 ? 'HIGH' : 
                      cancelData.totalCancellations > 3 ? 'MEDIUM' : 'LOW';
      
      console.log(`\n✅ GOOD DSR STORE ANALYSIS: ${store.storeName}`);
      console.log(`   DSR Status: GOOD (Meeting targets)`);
      console.log(`   Cancellations: ${cancelData.totalCancellations}`);
      console.log(`   Top Cancel Reasons: ${topCancellationReasons.map(r => r.reason).join(', ')}`);
      if (staffPerfData) {
        console.log(`   Staff Performance: ${staffPerfData.conversionRate}% (${staffPerfData.performanceStatus}) ✅ WILL BE SHOWN IN UI`);
      }
      
      const actionPlan = await this.generateAIActionPlan(
        store.storeName,
        [],
        topCancellationReasons,
        0,
        cancelData.totalCancellations,
        'CANCELLATION_ONLY',
        null,
        staffPerfData
      );
      
      console.log(`✅ AI action plan generated for ${store.storeName} (Good DSR)\n`);
      
      // Add delay between AI calls
      if (idx < topWorstStores.length - 1) {
        console.log(`⏳ Waiting 2 seconds before next AI call to avoid rate limits...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      allStoresWithPlans.push({
        storeName: store.storeName,
        cancellationStoreName: store.storeName,
        severity,
        dsrStatus: 'GOOD',
        dsrIssues: ['DSR performance is good - needs slight improvements'],
        dsrLoss: 0,
        dsrMetrics: {
          conversionRate: 'Meeting targets',
          billsPerformance: 'Good',
          quantityPerformance: 'Good',
          walkIns: 'N/A',
          lossOfSale: 'Minimal',
          absValue: 'N/A',
          abvValue: 'N/A'
        },
        staffPerformance: staffPerfData ? {
          walkIns: staffPerfData.walkIns || 0, // ✅ ADDED: Walk-ins from DSR
          bills: staffPerfData.bills || 0,
          conversionRate: staffPerfData.conversionRate || 'N/A',
          performanceStatus: staffPerfData.performanceStatus || 'N/A',
          quantity: staffPerfData.quantity || 0,
          lossOfSale: staffPerfData.lossOfSale || 0,
          staffCount: staffPerfData.staffCount || 0,
          staffIssues: staffPerfData.staffIssues || [],
          staffDetails: staffPerfData.staffDetails || [],
          lossOfSaleDetails: staffPerfData.lossOfSaleDetails || null, // ✅ ADDED: Loss of sale details
          attendance: staffPerfData.attendance || null // ✅ ADDED: Attendance data
        } : null,
        totalCancellations: cancelData.totalCancellations,
        cancellationReasons: topCancellationReasons.slice(0, 3),
        actionPlan,
        problemType: 'CANCELLATION_ONLY'
      });
      
      } else if (category === 'DSR_ONLY') {
        // DSR-only store: Poor DSR but NO cancellations
      const dsrData = store;
      const staffPerfData = recalculateStaffPerformance(store.storeName, store.staffPerformanceData);
      
      const dsrIssues = dsrData.rootCauses || dsrData.issues || [dsrData.whyBadPerforming || 'Performance issues'];
      const dsrLoss = parseFloat(dsrData.revenueLoss || dsrData.totalLoss || dsrData.absValue || 0) || 0;
      
      const severity = dsrLoss > 250 ? 'HIGH' : dsrLoss > 150 ? 'MEDIUM' : 'LOW';
      
      console.log(`\n📊 DSR-ONLY STORE ANALYSIS: ${store.storeName}`);
      console.log(`   DSR Status: POOR (Below targets)`);
      console.log(`   DSR Loss: ₹${dsrLoss.toLocaleString()}`);
      console.log(`   Cancellations: 0 (None)`);
      console.log(`   DSR Issues: ${dsrIssues.join(', ')}`);
      if (staffPerfData) {
        console.log(`   Staff Performance: ${staffPerfData.conversionRate}% (${staffPerfData.performanceStatus})`);
      }
      
      const actionPlan = await this.generateAIActionPlan(
        store.storeName,
        dsrIssues,
        [],
        dsrLoss,
        0,
        'DSR_ONLY',
        dsrData,
        staffPerfData
      );
      
      console.log(`✅ AI action plan generated for ${store.storeName} (DSR-only)\n`);
      
      // Add delay between AI calls
      if (idx < topWorstStores.length - 1) {
        console.log(`⏳ Waiting 2 seconds before next AI call to avoid rate limits...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      allStoresWithPlans.push({
        storeName: store.storeName,
        cancellationStoreName: store.storeName,
        severity,
        dsrStatus: 'POOR',
        dsrIssues,
        dsrLoss,
        dsrMetrics: {
          conversionRate: dsrData.conversionRate || 'N/A',
          billsPerformance: dsrData.billsPerformance || 'N/A',
          quantityPerformance: dsrData.quantityPerformance || 'N/A',
          walkIns: dsrData.walkIns || 'N/A',
          lossOfSale: dsrData.lossOfSale || 'N/A',
          absValue: dsrData.absValue || 'N/A',
          abvValue: dsrData.abvValue || 'N/A'
        },
        staffPerformance: staffPerfData ? {
          walkIns: staffPerfData.walkIns || 0, // ✅ ADDED: Walk-ins from DSR
          bills: staffPerfData.bills || 0,
          conversionRate: staffPerfData.conversionRate || 'N/A',
          performanceStatus: staffPerfData.performanceStatus || 'N/A',
          quantity: staffPerfData.quantity || 0,
          lossOfSale: staffPerfData.lossOfSale || 0,
          staffCount: staffPerfData.staffCount || 0,
          staffIssues: staffPerfData.staffIssues || [],
          staffDetails: staffPerfData.staffDetails || [],
          lossOfSaleDetails: staffPerfData.lossOfSaleDetails || null, // ✅ ADDED: Loss of sale details
          attendance: staffPerfData.attendance || null // ✅ ADDED: Attendance data
        } : null,
        totalCancellations: 0,
        cancellationReasons: [],
        actionPlan,
        problemType: 'DSR_ONLY'
      });
      }
    }
    
    // ✅ NEW: Process REMAINING stores with FALLBACK/RULE-BASED plans
    console.log(`\n📋 Generating RULE-BASED plans for ${remainingStores.length} remaining stores...\n`);
    
    for (let idx = 0; idx < remainingStores.length; idx++) {
      const store = remainingStores[idx];
      const category = store.category;
      
      console.log(`   ${idx + 1}/${remainingStores.length}: Generating fallback plan for ${store.storeName} (${category})...`);
      
      // Process based on category (similar to above but with fallback plans)
      if (category === 'CRITICAL') {
        const dsrData = store.dsrData;
        const cancelData = store.cancellationData;
        const staffPerfData = recalculateStaffPerformance(store.storeName, store.staffPerformanceData);
        
        const dsrIssues = dsrData.rootCauses || dsrData.issues || [dsrData.whyBadPerforming || 'Performance issues'];
        const dsrLoss = parseFloat(dsrData.revenueLoss || dsrData.totalLoss || dsrData.absValue || 0) || 0;
        const topCancellationReasons = cancelData.topReasons || [];
        
        const severity = dsrLoss > 250 && cancelData.totalCancellations > 5 ? 'CRITICAL' :
                        dsrLoss > 150 || cancelData.totalCancellations > 3 ? 'HIGH' : 'MEDIUM';
        
        // Use fallback plan instead of AI
        const actionPlan = this.generateActionPlanForStore(
          store.storeName,
          dsrIssues,
          topCancellationReasons,
          dsrLoss,
          cancelData.totalCancellations,
          'BOTH'
        );
        
        allStoresWithPlans.push({
          storeName: store.storeName,
          cancellationStoreName: store.cancellationStoreName,
          severity,
          dsrStatus: 'POOR',
          dsrIssues,
          dsrLoss,
          dsrMetrics: {
            conversionRate: dsrData.conversionRate || 'N/A',
            billsPerformance: dsrData.billsPerformance || 'N/A',
            quantityPerformance: dsrData.quantityPerformance || 'N/A',
            walkIns: dsrData.walkIns || 'N/A',
            lossOfSale: dsrData.lossOfSale || 'N/A',
            absValue: dsrData.absValue || 'N/A',
            abvValue: dsrData.abvValue || 'N/A'
          },
          staffPerformance: staffPerfData ? {
            walkIns: staffPerfData.walkIns || 0,
            bills: staffPerfData.bills || 0,
            conversionRate: staffPerfData.conversionRate || 'N/A',
            performanceStatus: staffPerfData.performanceStatus || 'N/A',
            quantity: staffPerfData.quantity || 0,
            lossOfSale: staffPerfData.lossOfSale || 0,
            staffCount: staffPerfData.staffCount || 0,
            staffIssues: staffPerfData.staffIssues || [],
            staffDetails: staffPerfData.staffDetails || [],
            lossOfSaleDetails: staffPerfData.lossOfSaleDetails || null,
            attendance: staffPerfData.attendance || null
          } : null,
          totalCancellations: cancelData.totalCancellations,
          cancellationReasons: topCancellationReasons.slice(0, 3),
          actionPlan,
          problemType: 'BOTH',
          usedFallbackPlan: true // Mark as fallback plan
        });
        
      } else if (category === 'CANCELLATION_ONLY') {
        const cancelData = store.cancellationData;
        const staffPerfData = recalculateStaffPerformance(store.storeName, store.staffPerformanceData);
        const topCancellationReasons = cancelData.topReasons || [];
        
        const severity = cancelData.totalCancellations > 5 ? 'HIGH' : 
                        cancelData.totalCancellations > 3 ? 'MEDIUM' : 'LOW';
        
        const actionPlan = this.generateActionPlanForStore(
          store.storeName,
          [],
          topCancellationReasons,
          0,
          cancelData.totalCancellations,
          'CANCELLATION_ONLY'
        );
        
        allStoresWithPlans.push({
          storeName: store.storeName,
          cancellationStoreName: store.storeName,
          severity,
          dsrStatus: 'GOOD',
          dsrIssues: ['DSR performance is good - needs slight improvements'],
          dsrLoss: 0,
          dsrMetrics: {
            conversionRate: 'Meeting targets',
            billsPerformance: 'Good',
            quantityPerformance: 'Good',
            walkIns: 'N/A',
            lossOfSale: 'Minimal',
            absValue: 'N/A',
            abvValue: 'N/A'
          },
          staffPerformance: staffPerfData ? {
            walkIns: staffPerfData.walkIns || 0,
            bills: staffPerfData.bills || 0,
            conversionRate: staffPerfData.conversionRate || 'N/A',
            performanceStatus: staffPerfData.performanceStatus || 'N/A',
            quantity: staffPerfData.quantity || 0,
            lossOfSale: staffPerfData.lossOfSale || 0,
            staffCount: staffPerfData.staffCount || 0,
            staffIssues: staffPerfData.staffIssues || [],
            staffDetails: staffPerfData.staffDetails || [],
            lossOfSaleDetails: staffPerfData.lossOfSaleDetails || null,
            attendance: staffPerfData.attendance || null
          } : null,
          totalCancellations: cancelData.totalCancellations,
          cancellationReasons: topCancellationReasons.slice(0, 3),
          actionPlan,
          problemType: 'CANCELLATION_ONLY',
          usedFallbackPlan: true
        });
        
      } else if (category === 'DSR_ONLY') {
        const dsrData = store;
        const staffPerfData = recalculateStaffPerformance(store.storeName, store.staffPerformanceData);
        
        const dsrIssues = dsrData.rootCauses || dsrData.issues || [dsrData.whyBadPerforming || 'Performance issues'];
        const dsrLoss = parseFloat(dsrData.revenueLoss || dsrData.totalLoss || dsrData.absValue || 0) || 0;
        
        const severity = dsrLoss > 250 ? 'HIGH' : dsrLoss > 150 ? 'MEDIUM' : 'LOW';
        
        const actionPlan = this.generateActionPlanForStore(
          store.storeName,
          dsrIssues,
          [],
          dsrLoss,
          0,
          'DSR_ONLY'
        );
        
        allStoresWithPlans.push({
          storeName: store.storeName,
          cancellationStoreName: store.storeName,
          severity,
          dsrStatus: 'POOR',
          dsrIssues,
          dsrLoss,
          dsrMetrics: {
            conversionRate: dsrData.conversionRate || 'N/A',
            billsPerformance: dsrData.billsPerformance || 'N/A',
            quantityPerformance: dsrData.quantityPerformance || 'N/A',
            walkIns: dsrData.walkIns || 'N/A',
            lossOfSale: dsrData.lossOfSale || 'N/A',
            absValue: dsrData.absValue || 'N/A',
            abvValue: dsrData.abvValue || 'N/A'
          },
          staffPerformance: staffPerfData ? {
            walkIns: staffPerfData.walkIns || 0,
            bills: staffPerfData.bills || 0,
            conversionRate: staffPerfData.conversionRate || 'N/A',
            performanceStatus: staffPerfData.performanceStatus || 'N/A',
            quantity: staffPerfData.quantity || 0,
            lossOfSale: staffPerfData.lossOfSale || 0,
            staffCount: staffPerfData.staffCount || 0,
            staffIssues: staffPerfData.staffIssues || [],
            staffDetails: staffPerfData.staffDetails || [],
            lossOfSaleDetails: staffPerfData.lossOfSaleDetails || null,
            attendance: staffPerfData.attendance || null
          } : null,
          totalCancellations: 0,
          cancellationReasons: [],
          actionPlan,
          problemType: 'DSR_ONLY',
          usedFallbackPlan: true
        });
      }
    }
    
    console.log(`✅ Fallback plans generated for all ${remainingStores.length} remaining stores\n`);
    
    // Sort by severity
    const severityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
    allStoresWithPlans.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    // Calculate summary
    const totalLoss = allStoresWithPlans
      .filter(s => s.problemType === 'BOTH' || s.problemType === 'DSR_ONLY')
      .reduce((sum, s) => sum + s.dsrLoss, 0);
    
    // ✅ FIX: Use totalCancellations from analysis (which is from filtered data)
    // This counts cancellations ONLY for the DSR date, not all time
    const allCancellations = cancellationResult?.analysis?.totalCancellations || 0;
    
    const estimatedRecovery = Math.round(totalLoss * 0.7);
    
    const criticalCount = allStoresWithPlans.filter(s => s.severity === 'CRITICAL' || s.problemType === 'BOTH').length;
    
    console.log(`\n${'✅'.repeat(40)}`);
    console.log(`✅ AI ACTION PLAN GENERATION COMPLETE!`);
    console.log(`✅ Total Plans Generated: ${allStoresWithPlans.length}`);
    console.log(`✅ Critical Stores: ${criticalCount}`);
    console.log(`✅ Total Revenue Loss: ₹${totalLoss.toLocaleString()}`);
    console.log(`✅ Total Cancellations: ${allCancellations}`);
    console.log(`✅ Estimated Recovery: ₹${estimatedRecovery.toLocaleString()}`);
    console.log(`${'✅'.repeat(40)}\n`);
    
    return {
      summary: {
        criticalStores: criticalCount,
        totalStoresWithIssues: allStoresWithPlans.length,
        totalLoss,
        totalCancellations: allCancellations,
        estimatedRecovery
      },
      allStores: allStoresWithPlans,
      dsrOnlyStores: dsrOnlyStores.map(s => ({
        storeName: s.storeName,
        issues: s.rootCauses || s.issues || [s.whyBadPerforming] || [],
        loss: s.revenueLoss || s.totalLoss || s.absValue || 0,
        quickAction: this.getQuickDSRAction(s)
      })),
      cancellationOnlyStores: cancellationOnlyStores.map(s => ({
        storeName: s.storeName,
        totalCancellations: s.cancellationData.totalCancellations,
        topReason: s.cancellationData.topReasons?.[0]?.reason || 'N/A',
        quickFix: this.getQuickCancellationFix(s.cancellationData)
      }))
    };
  }

  // Generate specific action plan for a store (CEO perspective)
  generateActionPlanForStore(storeName, dsrIssues, cancellationReasons, loss, cancellationCount, problemType) {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    
    // If only cancellation problems (good DSR)
    if (problemType === 'CANCELLATION_ONLY') {
      immediate.push('DSR performance is good - maintain current sales strategies');
      immediate.push('Focus on reducing cancellations to improve customer retention');
    }
    
    // Analyze DSR issues and add immediate actions
    dsrIssues.forEach(issue => {
      const issueLower = issue.toLowerCase();
      if (issueLower.includes('staff') || issueLower.includes('training')) {
        immediate.push('Conduct emergency staff training session on sales conversion');
      }
      if (issueLower.includes('conversion') || issueLower.includes('walk')) {
        immediate.push('Review and fix sales process - why are walk-ins not converting?');
        shortTerm.push('Implement conversion tracking dashboard for real-time monitoring');
      }
      if (issueLower.includes('product') || issueLower.includes('knowledge')) {
        immediate.push('Brief all staff on top 20 products and their features');
      }
    });
    
    // Analyze cancellation reasons and add actions
    cancellationReasons.forEach(reason => {
      const reasonLower = reason.reason.toLowerCase();
      if (reasonLower.includes('delivery') || reasonLower.includes('response')) {
        immediate.push('Fix delivery communication - call customers immediately');
        shortTerm.push('Set up automated delivery reminders 24hrs before');
      }
      if (reasonLower.includes('costume') || reasonLower.includes('change')) {
        immediate.push('Offer flexible costume changes with minimal fees');
        shortTerm.push('Create "try before you decide" policy for premium customers');
      }
      if (reasonLower.includes('another store') || reasonLower.includes('purchased')) {
        immediate.push('Match competitor prices + offer 10% loyalty discount');
        longTerm.push('Build customer loyalty program with exclusive benefits');
      }
      if (reasonLower.includes('saree') || reasonLower.includes('rent')) {
        shortTerm.push('Expand saree rental collection and promote heavily');
      }
    });
    
    // Add general improvements based on severity
    if (loss > 25000) {
      immediate.push('Store Manager: Daily standup with team to track conversion metrics');
      shortTerm.push('Regional Manager visit: Full operational audit required');
    }
    
    if (cancellationCount > 5) {
      immediate.push('Reduce cancellation rate: Call each cancelled customer personally');
      shortTerm.push('Implement "save the sale" protocol - offer alternatives before cancellation');
    }
    
    // Long-term strategic actions
    longTerm.push('Invest in staff incentive program tied to conversion & retention');
    longTerm.push('Upgrade store ambiance and product display for better customer experience');
    longTerm.push('Build customer database for targeted marketing and retention campaigns');
    
    // Remove duplicates
    const uniqueImmediate = [...new Set(immediate)];
    const uniqueShortTerm = [...new Set(shortTerm)];
    const uniqueLongTerm = [...new Set(longTerm)];
    
    // Pad to ensure exactly 3 actions per category
    const paddingActions = [
      'Review store operations daily',
      'Monitor key performance metrics',
      'Engage with customers for feedback'
    ];
    
    while (uniqueImmediate.length < 3) {
      uniqueImmediate.push(paddingActions[uniqueImmediate.length % paddingActions.length]);
    }
    while (uniqueShortTerm.length < 3) {
      uniqueShortTerm.push(paddingActions[uniqueShortTerm.length % paddingActions.length]);
    }
    while (uniqueLongTerm.length < 3) {
      uniqueLongTerm.push(paddingActions[uniqueLongTerm.length % paddingActions.length]);
    }
    
    // Determine root cause category
    let rootCauseCategory = 'COMBINATION';
    let rootCauseText = 'Multiple factors affecting store performance';
    
    if (problemType === 'CANCELLATION_ONLY') {
      rootCauseCategory = 'CANCELLATIONS';
      rootCauseText = `PRIMARY ROOT CAUSE: High cancellations (${cancellationCount}) affecting customer retention`;
    } else if (dsrIssues.some(i => i.toLowerCase().includes('staff') || i.toLowerCase().includes('conversion'))) {
      rootCauseCategory = 'STAFF_PERFORMANCE';
      rootCauseText = `PRIMARY ROOT CAUSE: Staff performance and conversion issues combined with cancellations`;
    }
    
    return {
      rootCause: rootCauseText,
      rootCauseCategory: rootCauseCategory,
      immediate: uniqueImmediate.slice(0, 3), // Exactly 3
      shortTerm: uniqueShortTerm.slice(0, 3),
      longTerm: uniqueLongTerm.slice(0, 3),
      expectedImpact: `Expected ${Math.round(loss * 0.7).toLocaleString()} recovery in revenue + ${Math.round(cancellationCount * 0.6)} fewer cancellations within 2 months`
    };
  }

  getQuickDSRAction(store) {
    const issues = store.rootCauses || store.issues || [store.whyBadPerforming] || [];
    if (issues.length === 0) return 'Focus on maintaining performance';
    const issue = issues[0] || 'Performance issues';
    return `Address: ${issue.substring(0, 50)}...`;
  }

  getQuickCancellationFix(cancelData) {
    const topReason = cancelData.topReasons?.[0]?.reason || '';
    if (topReason.toLowerCase().includes('delivery')) return 'Improve delivery communication';
    if (topReason.toLowerCase().includes('costume')) return 'Offer flexible changes';
    if (topReason.toLowerCase().includes('another')) return 'Match competitor pricing';
    return 'Investigate and resolve';
  }
}

module.exports = new DSRController();
