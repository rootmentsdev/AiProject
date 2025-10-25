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
      const { convertDSRDateToDateRange } = require('../utils/dateConverter');
      const dsrSheetDate = dsrDataResult.date || "12/8/2025";
      const cancellationDateRange = convertDSRDateToDateRange(dsrSheetDate);
      
      const cancellationService = require('../services/cancellationService');
      const cancellationResult = await cancellationService.getCancellationAnalysis(
        cancellationDateRange.DateFrom,
        cancellationDateRange.DateTo,
        "0",
        "7777"
      );
      
      // Step 3: Get Staff Performance Data
      console.log("📊 Step 3: Fetching staff performance data...");
      const staffPerformanceService = require('../services/staffPerformanceService');
      
      let staffPerformanceResult = null;
      try {
        staffPerformanceResult = await staffPerformanceService.getStaffPerformanceAnalysis(
          cancellationDateRange.DateFrom,
          cancellationDateRange.DateTo,
          "0", // All locations
          "7777"
        );
        
        if (staffPerformanceResult && staffPerformanceResult.success) {
          console.log("✅ Staff performance data fetched successfully");
          const storeCount = Object.keys(staffPerformanceResult.analysis?.storeWisePerformance || {}).length;
          console.log(`📊 Staff performance data available for ${storeCount} stores`);
        } else {
          console.log("⚠️ Staff performance data not available or failed");
          console.log("⚠️ Continuing analysis without staff performance data");
        }
      } catch (staffError) {
        console.error("❌ Staff performance fetch failed:", staffError.message);
        console.log("⚠️ Continuing analysis without staff performance data");
        staffPerformanceResult = { success: false, analysis: { storeWisePerformance: {} } };
      }
      
      // Step 4: Compare and Match Stores (DSR, Cancellation, Staff Performance)
      console.log("📊 Step 4: Matching and comparing stores with all data sources...");
      const comparisonResult = this.compareStores(dsrAnalysis, cancellationResult, staffPerformanceResult);
      
      // Step 5: Generate AI-Powered CEO Action Plans
      console.log("\n🤖 Step 5: Generating AI-powered action plans...");
      const actionPlans = await this.generateCEOActionPlans(
        comparisonResult, 
        cancellationResult,
        staffPerformanceResult
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
    try {
      const prompt = this.buildActionPlanPrompt(storeName, dsrIssues, cancellationReasons, dsrLoss, cancellationCount, problemType, dsrData, staffPerformanceData);
      
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
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const aiResponse = response.data.choices[0].message.content;
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🤖 AI ACTION PLAN GENERATED FOR: ${storeName}`);
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
      
    } catch (error) {
      console.error(`\n❌ AI Action Plan generation FAILED for ${storeName}`);
      console.error(`❌ Error: ${error.message}`);
      console.error(`❌ Falling back to rule-based plan...\n`);
      
      // Fallback to rule-based plan
      const fallbackPlan = this.generateActionPlanForStore(storeName, dsrIssues, cancellationReasons, dsrLoss, cancellationCount, problemType);
      
      console.log('📋 FALLBACK PLAN GENERATED:');
      console.log(JSON.stringify(fallbackPlan, null, 2));
      console.log(`${'─'.repeat(80)}\n`);
      
      return fallbackPlan;
    }
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
        prompt += `• Walk-ins: ${dsrData.walkIns || 'N/A'}\n`;
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
        prompt += `• Walk-ins: ${staffPerformanceData.walkIns}\n`;
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
            prompt += `      • Walk-ins: ${staff.walkIns} | Bills: ${staff.bills}\n`;
            prompt += `      • Loss of Sale: ${staff.lossOfSale}\n`;
          });
        }
        
        prompt += `\n🔍 ROOT CAUSE ANALYSIS:\n`;
        if (parseFloat(staffPerformanceData.conversionRate) < 60) {
          prompt += `⚠️ STAFF PERFORMANCE is a MAJOR CONTRIBUTOR to low DSR performance.\n`;
          prompt += `The store's ${staffPerformanceData.conversionRate}% conversion rate indicates staff training/motivation issues.\n`;
        } else {
          prompt += `Staff performance is acceptable (${staffPerformanceData.conversionRate}%).\n`;
          prompt += `Low DSR performance likely caused by other factors (inventory, pricing, competition).\n`;
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
        prompt += `   ${i + 1}. ${reason.reason}\n`;
        prompt += `      • Frequency: ${reason.count} times (${reason.percentage}%)\n`;
        prompt += `      • Impact: ${reason.count > 2 ? 'HIGH' : reason.count > 1 ? 'MEDIUM' : 'LOW'}\n`;
      });
      
      // Add staff performance for cancellation-only stores
      if (staffPerformanceData) {
        prompt += `\n👥 STAFF PERFORMANCE ANALYSIS:\n`;
        prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prompt += `• Store Conversion Rate: ${staffPerformanceData.conversionRate}%\n`;
        prompt += `• Performance Status: ${staffPerformanceData.performanceStatus}\n`;
        prompt += `Staff performance is good, but cancellations are affecting customer retention.\n`;
      }
    }
    
    prompt += `\n🎯 YOUR DETAILED CEO-LEVEL TASK:\n`;
    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    prompt += `Analyze the SPECIFIC data points above and provide a COMPREHENSIVE, DATA-DRIVEN action plan in JSON format:\n\n`;
    
    prompt += `1. "suggestions": Array of 4-5 SPECIFIC insights based on the actual data:\n`;
    prompt += `   - Identify the ROOT CAUSE of each cancellation reason\n`;
    prompt += `   - Explain WHY the DSR metrics are poor (if applicable)\n`;
    prompt += `   - Find PATTERNS in the cancellation data\n`;
    prompt += `   - Calculate potential revenue recovery\n`;
    prompt += `   Example: "Root cause: 66% of cancellations are due to X, indicating Y problem"\n\n`;
    
    prompt += `2. "immediate": Array of 4-5 URGENT actions for 24-48 hours:\n`;
    prompt += `   - Must be SPECIFIC to the cancellation reasons listed above\n`;
    prompt += `   - Must address the HIGHEST frequency cancellation reason first\n`;
    prompt += `   - Include WHO should do it and HOW\n`;
    prompt += `   Example: "Store manager to call all ${cancellationCount} cancelled customers personally within 24 hours"\n\n`;
    
    prompt += `3. "shortTerm": Array of 4-5 tactical actions for 1-2 weeks:\n`;
    prompt += `   - Address each major cancellation reason with specific solutions\n`;
    prompt += `   - Include process improvements\n`;
    prompt += `   - Add staff training for identified gaps\n`;
    if (problemType === 'BOTH') {
      prompt += `   - Fix conversion rate issues with specific tactics\n`;
    }
    prompt += `\n`;
    
    prompt += `4. "longTerm": Array of 4-5 strategic changes for 1-3 months:\n`;
    prompt += `   - System-level improvements\n`;
    prompt += `   - Technology/infrastructure investments\n`;
    prompt += `   - Cultural/process changes\n`;
    prompt += `   - Build competitive advantages\n\n`;
    
    prompt += `5. "expectedImpact": One detailed sentence with:\n`;
    prompt += `   - Specific % reduction in cancellations expected\n`;
    prompt += `   - Estimated revenue recovery in ₹\n`;
    if (problemType === 'BOTH') {
      prompt += `   - Expected improvement in conversion rate\n`;
    }
    prompt += `   Example: "Expected to reduce cancellations by 40% (${Math.round(cancellationCount * 0.4)} fewer), recover ₹${Math.round(dsrLoss * 0.6).toLocaleString()}, and improve conversion to 75% within 2 months"\n\n`;
    
    prompt += `🔍 FOCUS AREAS (prioritize based on data above):\n`;
    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (problemType === 'BOTH') {
      prompt += `• CRITICAL: Fix walk-in to bill conversion (only ${dsrData?.conversionRate || 'low'} converting)\n`;
      prompt += `• HIGH: Address each cancellation reason with specific solutions\n`;
      prompt += `• HIGH: Improve bills and quantity performance\n`;
    }
    prompt += `• Reduce EACH specific cancellation reason (focus on highest % first)\n`;
    prompt += `• Improve customer communication and expectations management\n`;
    prompt += `• Enhance inventory management and costume availability\n`;
    prompt += `• Train staff on customer experience and sales techniques\n`;
    prompt += `• Build customer loyalty and retention programs\n`;
    prompt += `• Implement feedback loops and continuous improvement\n\n`;
    
    prompt += `⚠️ IMPORTANT: Your recommendations must be:\n`;
    prompt += `• SPECIFIC to the cancellation reasons in the data above\n`;
    prompt += `• ACTIONABLE with clear steps\n`;
    prompt += `• MEASURABLE with clear KPIs\n`;
    prompt += `• REALISTIC for a costume rental business in Kerala\n\n`;
    
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
        suggestions: parsed.suggestions || [],
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

  // Generate CEO-level action plans
  async generateCEOActionPlans(comparisonResult, cancellationResult, staffPerformanceResult) {
    const { criticalStores, dsrOnlyStores, cancellationOnlyStores } = comparisonResult;
    
    // Process ALL stores with cancellations (critical + cancellation-only)
    const allStoresWithPlans = [];
    
    console.log(`\n${'🤖'.repeat(40)}`);
    console.log(`🤖 STARTING AI-POWERED ACTION PLAN GENERATION FOR ALL STORES`);
    console.log(`🤖 Total Stores to Analyze: ${criticalStores.length + cancellationOnlyStores.length}`);
    console.log(`🤖 Critical Stores (Poor DSR + Cancellations): ${criticalStores.length}`);
    console.log(`🤖 Cancellation-Only Stores (Good DSR): ${cancellationOnlyStores.length}`);
    console.log(`🤖 ALL STORES WILL GET AI-POWERED ACTION PLANS!`);
    console.log(`${'🤖'.repeat(40)}\n`);
    
    // 1. Process critical stores (both DSR problems + cancellations) - WITH AI
    for (const store of criticalStores) {
      const dsrData = store.dsrData;
      const cancelData = store.cancellationData;
      const staffPerfData = store.staffPerformanceData;
      
      const dsrIssues = dsrData.rootCauses || dsrData.issues || [dsrData.whyBadPerforming || 'Performance issues'];
      const dsrLoss = dsrData.revenueLoss || dsrData.totalLoss || dsrData.absValue || 0;
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
      
      // Add 2-second delay between AI calls to avoid rate limiting
      if (criticalStores.indexOf(store) < criticalStores.length - 1) {
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
          absValue: dsrData.absValue || 'N/A'
        },
        // Staff Performance metrics
        staffPerformance: staffPerfData ? {
          conversionRate: staffPerfData.conversionRate || 'N/A',
          performanceStatus: staffPerfData.performanceStatus || 'N/A',
          walkIns: staffPerfData.walkIns || 0,
          bills: staffPerfData.bills || 0,
          lossOfSale: staffPerfData.lossOfSale || 0,
          staffCount: staffPerfData.staffCount || 0,
          staffIssues: staffPerfData.staffIssues || []
        } : null,
        totalCancellations: cancelData.totalCancellations,
        cancellationReasons: topCancellationReasons.slice(0, 3),
        actionPlan,
        problemType: 'BOTH'
      });
    }
    
    // 2. Process cancellation-only stores (good DSR, but has cancellations) - WITH AI
    for (const store of cancellationOnlyStores) {
      const cancelData = store.cancellationData;
      const staffPerfData = store.staffPerformanceData;
      const topCancellationReasons = cancelData.topReasons || [];
      
      const severity = cancelData.totalCancellations > 5 ? 'HIGH' : 
                      cancelData.totalCancellations > 3 ? 'MEDIUM' : 'LOW';
      
      console.log(`\n✅ GOOD DSR STORE ANALYSIS: ${store.storeName}`);
      console.log(`   DSR Status: GOOD (Meeting targets)`);
      console.log(`   Cancellations: ${cancelData.totalCancellations}`);
      console.log(`   Top Cancel Reasons: ${topCancellationReasons.map(r => r.reason).join(', ')}`);
      if (staffPerfData) {
        console.log(`   Staff Performance: ${staffPerfData.conversionRate}% (${staffPerfData.performanceStatus})`);
      }
      
      // Generate AI action plan for cancellation-only stores too!
      const actionPlan = await this.generateAIActionPlan(
        store.storeName,
        [], // No DSR issues
        topCancellationReasons,
        0, // No DSR loss
        cancelData.totalCancellations,
        'CANCELLATION_ONLY', // Only cancellation problems
        null, // No DSR data
        staffPerfData // Pass staff performance data
      );
      
      console.log(`✅ AI action plan generated for ${store.storeName} (Good DSR)\n`);
      
      // Add delay between AI calls
      if (cancellationOnlyStores.indexOf(store) < cancellationOnlyStores.length - 1) {
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
          absValue: 'N/A'
        },
        // Staff Performance metrics
        staffPerformance: staffPerfData ? {
          conversionRate: staffPerfData.conversionRate || 'N/A',
          performanceStatus: staffPerfData.performanceStatus || 'N/A',
          walkIns: staffPerfData.walkIns || 0,
          bills: staffPerfData.bills || 0,
          lossOfSale: staffPerfData.lossOfSale || 0,
          staffCount: staffPerfData.staffCount || 0,
          staffIssues: staffPerfData.staffIssues || []
        } : null,
        totalCancellations: cancelData.totalCancellations,
        cancellationReasons: topCancellationReasons.slice(0, 3),
        actionPlan,
        problemType: 'CANCELLATION_ONLY'
      });
    }
    
    // Sort by severity
    const severityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
    allStoresWithPlans.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    // Calculate summary
    const totalLoss = allStoresWithPlans
      .filter(s => s.problemType === 'BOTH')
      .reduce((sum, s) => sum + s.dsrLoss, 0);
    
    const allCancellations = Object.values(cancellationResult?.analysis?.storeWiseProblems || {})
      .reduce((sum, store) => sum + (store.totalCancellations || 0), 0);
    
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
    
    return {
      immediate: uniqueImmediate.slice(0, 3), // Top 3
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
