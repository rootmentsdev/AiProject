const dsrModel = require('../models/dsrModel');
const DailyResponse = require('../models/dailyResponseModel');

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
      console.log("🚀 Starting Integrated Analysis...");
      
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
      
      // Step 3: Compare and Match Stores
      console.log("📊 Step 3: Matching and comparing stores...");
      const comparisonResult = this.compareStores(dsrAnalysis, cancellationResult);
      
      // Step 4: Generate CEO Action Plans
      console.log("📊 Step 4: Generating action plans...");
      const actionPlans = this.generateCEOActionPlans(comparisonResult, cancellationResult);
      
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

  // Compare stores from DSR and cancellation data
  compareStores(dsrAnalysis, cancellationResult) {
    const criticalStores = [];
    const dsrOnlyStores = [];
    const cancellationOnlyStores = [];
    
    // Handle both field names: problemStores (old) and badPerformingStores (new)
    const dsrStores = dsrAnalysis.problemStores || dsrAnalysis.badPerformingStores || [];
    const cancellationStores = cancellationResult?.analysis?.storeWiseProblems || {};
    
    console.log(`\n🔍 Comparing ${dsrStores.length} DSR problem stores with ${Object.keys(cancellationStores).length} cancellation stores...`);
    
    // Find stores with BOTH DSR problems AND cancellations
    dsrStores.forEach(dsrStore => {
      const storeName = dsrStore.storeName || dsrStore.name;
      let matchedCancellationStore = null;
      let matchedStoreName = null;
      
      // Try to find matching cancellation store
      for (const [cancelStore, cancelData] of Object.entries(cancellationStores)) {
        if (this.fuzzyMatchStore(storeName, cancelStore)) {
          matchedCancellationStore = cancelData;
          matchedStoreName = cancelStore;
          console.log(`✓ MATCH: "${storeName}" → "${cancelStore}"`);
          break;
        }
      }
      
      if (matchedCancellationStore && matchedCancellationStore.totalCancellations > 0) {
        // Store has BOTH problems - CRITICAL!
        criticalStores.push({
          storeName: storeName,
          cancellationStoreName: matchedStoreName,
          dsrData: dsrStore,
          cancellationData: matchedCancellationStore
        });
      } else {
        // Store has only DSR problems
        dsrOnlyStores.push(dsrStore);
      }
    });
    
    // Find stores with ONLY cancellations (good DSR performance)
    Object.entries(cancellationStores).forEach(([cancelStore, cancelData]) => {
      const alreadyMatched = criticalStores.some(cs => cs.cancellationStoreName === cancelStore);
      if (!alreadyMatched && cancelData.totalCancellations > 0) {
        cancellationOnlyStores.push({
          storeName: cancelStore,
          cancellationData: cancelData
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
        criticalCount: criticalStores.length
      }
    };
  }

  // Generate CEO-level action plans
  generateCEOActionPlans(comparisonResult, cancellationResult) {
    const { criticalStores, dsrOnlyStores, cancellationOnlyStores } = comparisonResult;
    
    // Process ALL stores with cancellations (critical + cancellation-only)
    const allStoresWithPlans = [];
    
    // 1. Process critical stores (both DSR problems + cancellations)
    criticalStores.forEach(store => {
      const dsrData = store.dsrData;
      const cancelData = store.cancellationData;
      
      const dsrIssues = dsrData.rootCauses || dsrData.issues || [dsrData.whyBadPerforming || 'Performance issues'];
      const dsrLoss = dsrData.revenueLoss || dsrData.totalLoss || dsrData.absValue || 0;
      const topCancellationReasons = cancelData.topReasons || [];
      
      const severity = dsrLoss > 250 && cancelData.totalCancellations > 5 ? 'CRITICAL' :
                      dsrLoss > 150 || cancelData.totalCancellations > 3 ? 'HIGH' : 'MEDIUM';
      
      const actionPlan = this.generateActionPlanForStore(
        store.storeName,
        dsrIssues,
        topCancellationReasons,
        dsrLoss,
        cancelData.totalCancellations,
        'BOTH' // Has both problems
      );
      
      allStoresWithPlans.push({
        storeName: store.storeName,
        cancellationStoreName: store.cancellationStoreName,
        severity,
        dsrStatus: 'POOR',
        dsrIssues,
        dsrLoss,
        totalCancellations: cancelData.totalCancellations,
        cancellationReasons: topCancellationReasons.slice(0, 3),
        actionPlan,
        problemType: 'BOTH'
      });
    });
    
    // 2. Process cancellation-only stores (good DSR, but has cancellations)
    cancellationOnlyStores.forEach(store => {
      const cancelData = store.cancellationData;
      const topCancellationReasons = cancelData.topReasons || [];
      
      const severity = cancelData.totalCancellations > 5 ? 'HIGH' : 
                      cancelData.totalCancellations > 3 ? 'MEDIUM' : 'LOW';
      
      const actionPlan = this.generateActionPlanForStore(
        store.storeName,
        [],
        topCancellationReasons,
        0,
        cancelData.totalCancellations,
        'CANCELLATION_ONLY' // Only cancellation problems
      );
      
      allStoresWithPlans.push({
        storeName: store.storeName,
        cancellationStoreName: store.storeName,
        severity,
        dsrStatus: 'GOOD',
        dsrIssues: ['DSR performance is good - needs slight improvements'],
        dsrLoss: 0,
        totalCancellations: cancelData.totalCancellations,
        cancellationReasons: topCancellationReasons.slice(0, 3),
        actionPlan,
        problemType: 'CANCELLATION_ONLY'
      });
    });
    
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
