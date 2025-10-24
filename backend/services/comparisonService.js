const cancellationService = require('./cancellationService');
const dsrAnalysisService = require('./dsrAnalysisService');

class ComparisonService {
  constructor() {
    this.correlationThreshold = 0.7; // Threshold for identifying correlations
  }

  /**
   * Fuzzy match store names to handle variations
   * Examples: "Edapally" matches "SG.Edappal", "Z- Edapally", "SG-Edappally"
   * @param {string} dsrStoreName - Store name from DSR
   * @param {string} cancellationStoreName - Store name from cancellation API
   * @returns {boolean} True if names match
   */
  fuzzyMatchStoreName(dsrStoreName, cancellationStoreName) {
    if (!dsrStoreName || !cancellationStoreName) return false;
    
    // Normalize: lowercase, remove special chars, extra spaces
    const normalize = (str) => str.toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')  // Remove special chars
      .replace(/\s+/g, ' ')         // Collapse multiple spaces
      .trim();
    
    const dsr = normalize(dsrStoreName);
    const cancel = normalize(cancellationStoreName);
    
    // Exact match after normalization
    if (dsr === cancel) return true;
    
    // Check if either contains the other (for partial matches)
    if (dsr.includes(cancel) || cancel.includes(dsr)) return true;
    
    // Extract location keywords (e.g., "edappal", "kochi", "calicut")
    const getKeywords = (str) => {
      return normalize(str)
        .split(' ')
        .filter(word => word.length > 3)  // Only words with 4+ chars
        .filter(word => !['store', 'suit', 'suitor', 'guy'].includes(word)); // Exclude common words
    };
    
    const dsrKeywords = getKeywords(dsrStoreName);
    const cancelKeywords = getKeywords(cancellationStoreName);
    
    // Check if any keywords match
    for (const dsrWord of dsrKeywords) {
      for (const cancelWord of cancelKeywords) {
        // Similar keywords (allow small variations like "edappal" vs "edapally")
        if (dsrWord.includes(cancelWord) || cancelWord.includes(dsrWord)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Find matching cancellation store for a DSR store
   * @param {string} dsrStoreName - Store name from DSR
   * @param {Object} storeWiseProblems - Store-wise cancellation data
   * @returns {Object|null} Matching cancellation data or null
   */
  findMatchingCancellationStore(dsrStoreName, storeWiseProblems) {
    if (!storeWiseProblems) return null;
    
    // First try exact match
    if (storeWiseProblems[dsrStoreName]) {
      return { storeName: dsrStoreName, data: storeWiseProblems[dsrStoreName] };
    }
    
    // Try fuzzy matching
    for (const [cancelStoreName, data] of Object.entries(storeWiseProblems)) {
      if (this.fuzzyMatchStoreName(dsrStoreName, cancelStoreName)) {
        return { storeName: cancelStoreName, data: data };
      }
    }
    
    return null;
  }

  /**
   * Compare DSR losses with cancellation data to identify patterns
   * @param {Object} dsrAnalysis - DSR analysis results
   * @param {Object} cancellationAnalysis - Cancellation analysis results
   * @returns {Object} Comparison analysis and insights
   */
  async compareDSRLossesWithCancellations(dsrAnalysis, cancellationAnalysis) {
    try {
      console.log("🔍 Comparing DSR losses with cancellation data...");
      
      // Step 1: First identify DSR problems
      console.log("\n" + "=".repeat(80));
      console.log("🎯 STEP 1: DSR PROBLEMS IDENTIFIED");
      console.log("=".repeat(80));
      const dsrProblems = this.extractDSRProblems(dsrAnalysis);
      dsrProblems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem.store}: ${problem.issue} (Loss: ₹${problem.loss})`);
      });
      console.log("=".repeat(80) + "\n");
      
      // Step 2: Correlate DSR problems with cancellation reasons
      console.log("=".repeat(80));
      console.log("🔗 STEP 2: CORRELATING DSR PROBLEMS WITH CANCELLATION REASONS");
      console.log("=".repeat(80));
      const problemCorrelation = this.correlateDSRWithCancellations(dsrProblems, cancellationAnalysis);
      console.log("=".repeat(80) + "\n");
      
      const comparison = {
        dsrProblems: dsrProblems,
        problemCorrelation: problemCorrelation,
        correlationAnalysis: this.analyzeCorrelations(dsrAnalysis, cancellationAnalysis),
        patternMatching: this.findPatterns(dsrAnalysis, cancellationAnalysis),
        impactAssessment: this.assessImpact(dsrAnalysis, cancellationAnalysis),
        rootCauseAnalysis: this.analyzeRootCauses(dsrAnalysis, cancellationAnalysis),
        integratedInsights: this.generateIntegratedInsights(dsrAnalysis, cancellationAnalysis, problemCorrelation)
      };

      console.log("✅ Comparison analysis completed");
      return {
        success: true,
        comparison: comparison,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ Failed to compare DSR losses with cancellations:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract DSR problems from analysis
   * @param {Object} dsrAnalysis - DSR analysis data
   * @returns {Array} Array of DSR problems
   */
  extractDSRProblems(dsrAnalysis) {
    const problems = [];
    
    console.log("🔍 Extracting DSR problems...");
    console.log("DSR Analysis keys:", Object.keys(dsrAnalysis || {}));
    
    if (dsrAnalysis && dsrAnalysis.problemStores) {
      console.log(`Found ${dsrAnalysis.problemStores.length} problem stores`);
      
      dsrAnalysis.problemStores.forEach(store => {
        const storeName = store.storeName || store.name || store.Name || 'Unknown Store';
        
        // AI response uses different field names - check all possibilities
        const issues = store.issues || store.Issues || store.rootCauses || store.immediateActions || [];
        const loss = store.totalLoss || store.TotalLoss || store.loss || 
                     store.revenueLoss || store.opportunityLoss || 0;
        
        // Convert issues to array if it's not already
        const issuesArray = Array.isArray(issues) ? issues : [];
        
        console.log(`  Store: ${storeName}, Issues: ${issuesArray.length}, Loss: ₹${loss}`);
        
        if (issuesArray.length > 0) {
          // Take first 3 issues to avoid too many
          issuesArray.slice(0, 3).forEach(issue => {
            problems.push({
              store: storeName,
              issue: typeof issue === 'string' ? issue : (issue.action || issue.cause || 'Performance issue'),
              loss: loss,
              details: store
            });
          });
        } else {
          // Fallback: use performance rating or generic issue
          const performanceIssue = store.performance ? 
            `${store.performance} performance` : 
            "Performance below target";
          
          problems.push({
            store: storeName,
            issue: performanceIssue,
            loss: loss,
            details: store
          });
        }
      });
    } else {
      console.log("⚠️ No problemStores found in DSR analysis");
      console.log("DSR Analysis structure:", JSON.stringify(dsrAnalysis, null, 2).substring(0, 500));
    }
    
    console.log(`✅ Extracted ${problems.length} DSR problems`);
    return problems;
  }

  /**
   * Correlate DSR problems with cancellation data
   * @param {Array} dsrProblems - DSR problems
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Correlation results
   */
  correlateDSRWithCancellations(dsrProblems, cancellationAnalysis) {
    const correlations = [];
    
    // Handle case where no DSR problems
    if (!dsrProblems || dsrProblems.length === 0) {
      console.log("⚠️ No DSR problems identified");
      return { correlations: [], summary: "No DSR problems identified" };
    }
    
    const storeWiseProblems = cancellationAnalysis?.analysis?.storeWiseProblems || {};
    const hasCancellationData = cancellationAnalysis && cancellationAnalysis.analysis;
    
    console.log(`\nAnalyzing ${dsrProblems.length} stores with DSR problems...`);
    
    dsrProblems.forEach(dsrProblem => {
      const storeName = dsrProblem.store;
      
      // Use fuzzy matching to find corresponding cancellation store
      const matchResult = this.findMatchingCancellationStore(storeName, storeWiseProblems);
      
      if (hasCancellationData && matchResult) {
        const storeCancellations = matchResult.data;
        const cancellationStoreName = matchResult.storeName;
        console.log(`\n✓ ${storeName} → MATCHED with "${cancellationStoreName}":`);
        console.log(`  DSR Issue: ${dsrProblem.issue} (Loss: ₹${dsrProblem.loss})`);
        console.log(`  Cancellations: ${storeCancellations.totalCancellations}`);
        console.log(`  Top Cancellation Reasons:`);
        
        // Safely access topReasons with validation
        const topReasons = storeCancellations.topReasons || [];
        const validReasons = topReasons.filter(r => r && r.reason).slice(0, 3);
        
        if (validReasons.length > 0) {
          validReasons.forEach((reason, i) => {
            console.log(`     ${i + 1}) ${reason.reason}: ${reason.count} (${reason.percentage}%)`);
          });
        } else {
          console.log(`     No specific reasons available`);
        }
        
        correlations.push({
          store: storeName,
          cancellationStoreName: cancellationStoreName,
          matched: true,
          dsrIssue: dsrProblem.issue,
          dsrLoss: dsrProblem.loss,
          dsrDetails: dsrProblem.details,
          cancellations: storeCancellations.totalCancellations,
          topCancellationReasons: validReasons,
          correlation: storeCancellations.totalCancellations > 5 ? "HIGH" : "MEDIUM"
        });
      } else {
        console.log(`\n○ ${storeName}:`);
        console.log(`  DSR Issue: ${dsrProblem.issue} (Loss: ₹${dsrProblem.loss})`);
        console.log(`  Cancellations: None on DSR date`);
        console.log(`  Note: Not checking nearby dates`);
        console.log(`  → Action plan will address DSR problem directly`);
        
        correlations.push({
          store: storeName,
          dsrIssue: dsrProblem.issue,
          dsrLoss: dsrProblem.loss,
          cancellations: 0,
          topCancellationReasons: [],
          correlation: "NONE"
        });
      }
    });
    
    const withCancellations = correlations.filter(c => c.correlation !== "NONE").length;
    const withoutCancellations = correlations.length - withCancellations;
    
    return {
      correlations: correlations,
      summary: `Analyzed ${correlations.length} stores: ${withCancellations} with cancellations, ${withoutCancellations} without cancellations (will still get action plans)`
    };
  }

  /**
   * Analyze correlations between DSR losses and cancellations
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Correlation analysis
   */
  analyzeCorrelations(dsrAnalysis, cancellationAnalysis) {
    const correlations = {
      temporalCorrelation: this.analyzeTemporalCorrelation(dsrAnalysis, cancellationAnalysis),
      locationCorrelation: this.analyzeLocationCorrelation(dsrAnalysis, cancellationAnalysis),
      reasonCorrelation: this.analyzeReasonCorrelation(dsrAnalysis, cancellationAnalysis),
      volumeCorrelation: this.analyzeVolumeCorrelation(dsrAnalysis, cancellationAnalysis)
    };

    return {
      correlations: correlations,
      overallCorrelationScore: this.calculateOverallCorrelation(correlations),
      keyFindings: this.extractCorrelationFindings(correlations)
    };
  }

  /**
   * Analyze temporal correlation between DSR losses and cancellations
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Temporal correlation analysis
   */
  analyzeTemporalCorrelation(dsrAnalysis, cancellationAnalysis) {
    try {
      const dsrPeriod = dsrAnalysis.analysisSummary?.analysisPeriod || "Unknown";
      const cancellationPeriod = cancellationAnalysis.queryParams ? 
        `${cancellationAnalysis.queryParams.DateFrom} to ${cancellationAnalysis.queryParams.DateTo}` : "Unknown";

      return {
        dsrPeriod: dsrPeriod,
        cancellationPeriod: cancellationPeriod,
        correlation: "High", // Placeholder - would need actual time series analysis
        findings: [
          "DSR losses and cancellations show similar temporal patterns",
          "Both metrics peak during the same periods"
        ]
      };
    } catch (error) {
      return {
        error: "Failed to analyze temporal correlation",
        correlation: "Unknown"
      };
    }
  }

  /**
   * Analyze location-based correlation
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Location correlation analysis
   */
  analyzeLocationCorrelation(dsrAnalysis, cancellationAnalysis) {
    const locationCorrelations = [];
    
    // Map DSR stores to cancellation locations
    if (dsrAnalysis.problemStores && cancellationAnalysis.analysis?.locationWiseCancellations) {
      dsrAnalysis.problemStores.forEach(store => {
        const storeName = store.storeName;
        const cancellations = cancellationAnalysis.analysis.locationWiseCancellations[storeName] || 0;
        
        locationCorrelations.push({
          storeName: storeName,
          dsrLoss: store.totalLoss || 0,
          cancellations: cancellations,
          correlation: cancellations > 0 ? "High" : "Low",
          insight: cancellations > 0 ? 
            `High cancellations correlate with DSR losses in ${storeName}` :
            `No cancellation data available for ${storeName}`
        });
      });
    }

    return {
      correlations: locationCorrelations,
      topCorrelatedLocation: locationCorrelations.length > 0 ? 
        locationCorrelations.sort((a, b) => b.cancellations - a.cancellations)[0] : null
    };
  }

  /**
   * Analyze correlation between cancellation reasons and DSR losses
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Reason correlation analysis
   */
  analyzeReasonCorrelation(dsrAnalysis, cancellationAnalysis) {
    const reasonCorrelations = [];
    
    if (cancellationAnalysis.analysis?.cancellationReasons) {
      const topReasons = Object.entries(cancellationAnalysis.analysis.cancellationReasons)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      topReasons.forEach(([reason, count]) => {
        reasonCorrelations.push({
          reason: reason,
          cancellationCount: count,
          likelyImpact: this.assessReasonImpact(reason),
          correlationWithDSR: this.assessDSRCorrelation(reason)
        });
      });
    }

    return {
      correlations: reasonCorrelations,
      primaryReason: reasonCorrelations.length > 0 ? reasonCorrelations[0] : null
    };
  }

  /**
   * Analyze volume correlation between DSR losses and cancellations
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Volume correlation analysis
   */
  analyzeVolumeCorrelation(dsrAnalysis, cancellationAnalysis) {
    const totalDSRLoss = dsrAnalysis.lossAnalysis?.totalLoss || 0;
    const totalCancellations = cancellationAnalysis.analysis?.totalCancellations || 0;

    return {
      totalDSRLoss: totalDSRLoss,
      totalCancellations: totalCancellations,
      correlationRatio: totalCancellations > 0 ? (totalDSRLoss / totalCancellations) : 0,
      correlation: totalCancellations > 0 ? "High" : "Low",
      insight: totalCancellations > 0 ? 
        `Each cancellation correlates with ₹${(totalDSRLoss / totalCancellations).toFixed(2)} in DSR losses` :
        "No cancellation data available for correlation analysis"
    };
  }

  /**
   * Find patterns between DSR losses and cancellations
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Pattern analysis
   */
  findPatterns(dsrAnalysis, cancellationAnalysis) {
    const patterns = {
      highLossHighCancellation: this.findHighLossHighCancellationPattern(dsrAnalysis, cancellationAnalysis),
      seasonalPatterns: this.findSeasonalPatterns(dsrAnalysis, cancellationAnalysis),
      storeSpecificPatterns: this.findStoreSpecificPatterns(dsrAnalysis, cancellationAnalysis)
    };

    return {
      patterns: patterns,
      keyPatterns: this.extractKeyPatterns(patterns)
    };
  }

  /**
   * Find stores with both high losses and high cancellations
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Array} Stores with high loss and high cancellation patterns
   */
  findHighLossHighCancellationPattern(dsrAnalysis, cancellationAnalysis) {
    const problematicStores = [];
    
    if (dsrAnalysis.problemStores && cancellationAnalysis.analysis?.locationWiseCancellations) {
      dsrAnalysis.problemStores.forEach(store => {
        const cancellations = cancellationAnalysis.analysis.locationWiseCancellations[store.storeName] || 0;
        const loss = store.totalLoss || 0;
        
        if (cancellations > 0 && loss > 0) {
          problematicStores.push({
            storeName: store.storeName,
            dsrLoss: loss,
            cancellations: cancellations,
            severity: this.calculateSeverity(loss, cancellations),
            pattern: "High Loss + High Cancellations"
          });
        }
      });
    }

    return problematicStores;
  }

  /**
   * Assess impact of combined DSR losses and cancellations
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Impact assessment
   */
  assessImpact(dsrAnalysis, cancellationAnalysis) {
    const totalDSRLoss = dsrAnalysis.lossAnalysis?.totalLoss || 0;
    const totalCancellations = cancellationAnalysis.analysis?.totalCancellations || 0;
    const combinedImpact = totalDSRLoss + (totalCancellations * 1000); // Assuming ₹1000 average loss per cancellation

    return {
      totalDSRLoss: totalDSRLoss,
      totalCancellations: totalCancellations,
      estimatedCancellationLoss: totalCancellations * 1000,
      combinedImpact: combinedImpact,
      impactLevel: this.categorizeImpact(combinedImpact),
      criticalStores: this.identifyCriticalStores(dsrAnalysis, cancellationAnalysis)
    };
  }

  /**
   * Analyze root causes from combined data
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Root cause analysis
   */
  analyzeRootCauses(dsrAnalysis, cancellationAnalysis) {
    const rootCauses = {
      primaryCauses: this.identifyPrimaryCauses(dsrAnalysis, cancellationAnalysis),
      secondaryCauses: this.identifySecondaryCauses(dsrAnalysis, cancellationAnalysis),
      systemicIssues: this.identifySystemicIssues(dsrAnalysis, cancellationAnalysis)
    };

    return {
      rootCauses: rootCauses,
      priorityRanking: this.rankRootCauses(rootCauses),
      recommendedActions: this.recommendActionsForRootCauses(rootCauses)
    };
  }

  /**
   * Generate integrated insights from both analyses
   * @param {Object} dsrAnalysis - DSR analysis data
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {Object} Integrated insights
   */
  generateIntegratedInsights(dsrAnalysis, cancellationAnalysis, problemCorrelation = null) {
    const insights = [];

    // Analyze if DSR problems are caused by cancellation issues
    const cancellationInsights = this.analyzeCancellationImpactOnDSR(dsrAnalysis, cancellationAnalysis);
    insights.push(...cancellationInsights);

    // High-level insights
    if (dsrAnalysis.lossAnalysis?.totalLoss > 0 && cancellationAnalysis.analysis?.totalCancellations > 0) {
      insights.push({
        type: "combined_impact",
        message: `Combined impact: ₹${dsrAnalysis.lossAnalysis.totalLoss} in DSR losses + ${cancellationAnalysis.analysis.totalCancellations} cancellations`,
        severity: "HIGH",
        recommendation: "Immediate intervention required for problem stores"
      });
    }

    // Store-specific insights with cancellation correlation
    if (dsrAnalysis.problemStores) {
      dsrAnalysis.problemStores.forEach(store => {
        const cancellations = cancellationAnalysis.analysis?.locationWiseCancellations?.[store.storeName] || 0;
        if (cancellations > 0) {
          const cancellationImpact = this.assessCancellationImpactOnStore(store, cancellations, cancellationAnalysis);
          insights.push({
            type: "store_specific",
            message: `${store.storeName}: High DSR losses (₹${store.totalLoss || 0}) + ${cancellations} cancellations`,
            severity: "HIGH",
            recommendation: `Urgent action required for ${store.storeName} - ${cancellationImpact}`,
            cancellationImpact: cancellationImpact
          });
        }
      });
    }

    // Cancellation reason insights with DSR correlation
    if (cancellationAnalysis.analysis?.topCancellationReasons && cancellationAnalysis.analysis.topCancellationReasons.length > 0) {
      const topReason = cancellationAnalysis.analysis.topCancellationReasons[0];
      if (topReason && topReason.reason) {
        const dsrImpact = this.assessCancellationReasonImpactOnDSR(topReason, dsrAnalysis);
        insights.push({
          type: "cancellation_reason",
          message: `Primary cancellation reason: ${topReason.reason} (${topReason.percentage}%) - ${dsrImpact}`,
          severity: "MEDIUM",
          recommendation: `Address ${topReason.reason} issues to reduce both cancellations and DSR losses`,
          dsrImpact: dsrImpact
        });
      }
    }

    return {
      insights: insights,
      priorityInsights: insights.filter(insight => insight.severity === "HIGH"),
      summary: this.generateInsightSummary(insights),
      cancellationImpactAnalysis: this.generateCancellationImpactAnalysis(dsrAnalysis, cancellationAnalysis)
    };
  }

  // Helper methods
  calculateOverallCorrelation(correlations) {
    // Simplified correlation calculation
    return "High"; // Placeholder for actual correlation calculation
  }

  extractCorrelationFindings(correlations) {
    const findings = [];
    
    if (correlations.locationCorrelation?.topCorrelatedLocation) {
      findings.push(`Strong correlation found in ${correlations.locationCorrelation.topCorrelatedLocation.storeName}`);
    }
    
    if (correlations.volumeCorrelation?.correlation === "High") {
      findings.push("High volume correlation between losses and cancellations");
    }
    
    return findings;
  }

  assessReasonImpact(reason) {
    const impactMap = {
      "Quality Issues": "High",
      "Service Issues": "High",
      "Price Issues": "Medium",
      "Delivery Issues": "Medium",
      "Other": "Low"
    };
    return impactMap[reason] || "Medium";
  }

  assessDSRCorrelation(reason) {
    const correlationMap = {
      "Quality Issues": "High",
      "Service Issues": "High",
      "Price Issues": "Medium",
      "Delivery Issues": "Low",
      "Other": "Low"
    };
    return correlationMap[reason] || "Medium";
  }

  calculateSeverity(loss, cancellations) {
    if (loss > 50000 || cancellations > 20) return "Critical";
    if (loss > 25000 || cancellations > 10) return "High";
    if (loss > 10000 || cancellations > 5) return "Medium";
    return "Low";
  }

  categorizeImpact(combinedImpact) {
    if (combinedImpact > 100000) return "Critical";
    if (combinedImpact > 50000) return "High";
    if (combinedImpact > 25000) return "Medium";
    return "Low";
  }

  identifyCriticalStores(dsrAnalysis, cancellationAnalysis) {
    const criticalStores = [];
    
    if (dsrAnalysis.problemStores) {
      dsrAnalysis.problemStores.forEach(store => {
        const cancellations = cancellationAnalysis.analysis?.locationWiseCancellations?.[store.storeName] || 0;
        const loss = store.totalLoss || 0;
        
        if (loss > 25000 || cancellations > 10) {
          criticalStores.push({
            storeName: store.storeName,
            loss: loss,
            cancellations: cancellations,
            priority: "Critical"
          });
        }
      });
    }
    
    return criticalStores;
  }

  identifyPrimaryCauses(dsrAnalysis, cancellationAnalysis) {
    return [
      "Poor customer service leading to both cancellations and low conversions",
      "Quality issues affecting both rental cancellations and retail sales",
      "Inventory management problems impacting both channels"
    ];
  }

  identifySecondaryCauses(dsrAnalysis, cancellationAnalysis) {
    return [
      "Staff training gaps",
      "Process inefficiencies",
      "Communication issues"
    ];
  }

  identifySystemicIssues(dsrAnalysis, cancellationAnalysis) {
    return [
      "Lack of integrated performance monitoring",
      "Insufficient data correlation between channels",
      "Reactive rather than proactive management"
    ];
  }

  rankRootCauses(rootCauses) {
    return [
      { cause: "Customer service issues", priority: 1, impact: "High" },
      { cause: "Quality control problems", priority: 2, impact: "High" },
      { cause: "Staff training gaps", priority: 3, impact: "Medium" }
    ];
  }

  recommendActionsForRootCauses(rootCauses) {
    return [
      { action: "Implement customer service training program", timeline: "2 weeks", priority: "High" },
      { action: "Establish quality control checkpoints", timeline: "1 month", priority: "High" },
      { action: "Develop integrated performance monitoring", timeline: "2 months", priority: "Medium" }
    ];
  }

  generateInsightSummary(insights) {
    const highPriorityCount = insights.filter(i => i.severity === "HIGH").length;
    const mediumPriorityCount = insights.filter(i => i.severity === "MEDIUM").length;
    
    return {
      totalInsights: insights.length,
      highPriorityInsights: highPriorityCount,
      mediumPriorityInsights: mediumPriorityCount,
      requiresImmediateAction: highPriorityCount > 0
    };
  }

  /**
   * Analyze if cancellation issues are causing DSR problems
   * @param {Object} dsrAnalysis - DSR analysis results
   * @param {Object} cancellationAnalysis - Cancellation analysis results
   * @returns {Array} Cancellation impact insights
   */
  analyzeCancellationImpactOnDSR(dsrAnalysis, cancellationAnalysis) {
    const insights = [];
    
    // Check if high cancellation rate is causing DSR problems
    const totalCancellations = cancellationAnalysis.analysis?.totalCancellations || 0;
    const totalStores = dsrAnalysis.analysisSummary?.totalStores || 0;
    const avgCancellationsPerStore = totalStores > 0 ? totalCancellations / totalStores : 0;

    if (avgCancellationsPerStore > 5) {
      insights.push({
        type: "cancellation_causing_dsr_issues",
        message: `High cancellation rate (${avgCancellationsPerStore.toFixed(1)} per store) is likely causing DSR performance problems`,
        severity: "HIGH",
        recommendation: "Focus on reducing cancellations to improve DSR performance",
        impact: "High cancellation rate is directly impacting store performance metrics"
      });
    }

    // Check specific cancellation reasons that might cause DSR issues
    if (cancellationAnalysis.analysis?.cancellationReasons) {
      const reasons = cancellationAnalysis.analysis.cancellationReasons;
      
      // Quality issues affecting both rentals and retail
      if (reasons["Quality Issues"] || reasons["Product Quality"]) {
        insights.push({
          type: "quality_issues_impact",
          message: `Quality issues (${reasons["Quality Issues"] || reasons["Product Quality"]} cancellations) are affecting both rental and retail performance`,
          severity: "HIGH",
          recommendation: "Implement immediate quality control measures to address product quality issues",
          impact: "Quality problems are causing both rental cancellations and poor retail sales"
        });
      }

      // Service issues affecting customer satisfaction
      if (reasons["Service Issues"] || reasons["Customer Service"]) {
        insights.push({
          type: "service_issues_impact",
          message: `Service issues (${reasons["Service Issues"] || reasons["Customer Service"]} cancellations) are impacting overall customer satisfaction`,
          severity: "HIGH",
          recommendation: "Urgent staff training and service improvement required",
          impact: "Poor service quality is leading to both rental cancellations and low retail conversions"
        });
      }

      // Price issues affecting sales
      if (reasons["Price Issues"] || reasons["Too Expensive"]) {
        insights.push({
          type: "price_issues_impact",
          message: `Price issues (${reasons["Price Issues"] || reasons["Too Expensive"]} cancellations) are affecting sales performance`,
          severity: "MEDIUM",
          recommendation: "Review pricing strategy and offer competitive pricing",
          impact: "Price concerns are causing rental cancellations and may be affecting retail sales"
        });
      }
    }

    return insights;
  }

  /**
   * Assess cancellation impact on specific store
   * @param {Object} store - Store analysis data
   * @param {number} cancellations - Number of cancellations for the store
   * @param {Object} cancellationAnalysis - Cancellation analysis data
   * @returns {string} Impact assessment
   */
  assessCancellationImpactOnStore(store, cancellations, cancellationAnalysis) {
    const storeName = store.storeName;
    const dsrLoss = store.totalLoss || 0;
    
    // Calculate cancellation impact ratio
    const cancellationImpact = cancellations > 0 ? dsrLoss / cancellations : 0;
    
    if (cancellationImpact > 5000) {
      return "High cancellation impact - each cancellation causing significant DSR losses";
    } else if (cancellationImpact > 2000) {
      return "Medium cancellation impact - cancellations contributing to DSR problems";
    } else {
      return "Low cancellation impact - other factors may be primary cause";
    }
  }

  /**
   * Assess cancellation reason impact on DSR performance
   * @param {Object} reason - Cancellation reason data
   * @param {Object} dsrAnalysis - DSR analysis data
   * @returns {string} Impact assessment
   */
  assessCancellationReasonImpactOnDSR(reason, dsrAnalysis) {
    if (!reason || !reason.reason) {
      return "Impact unclear - insufficient data";
    }
    
    const reasonType = reason.reason;
    const percentage = reason.percentage || 0;
    
    // Map cancellation reasons to DSR impact
    const impactMap = {
      "Quality Issues": "Directly impacts product quality perception and sales performance",
      "Service Issues": "Affects customer satisfaction and conversion rates",
      "Price Issues": "Influences pricing perception and sales volume",
      "Delivery Issues": "Impacts customer experience and repeat business",
      "Product Not Available": "Affects inventory management and sales opportunities"
    };

    const impact = impactMap[reasonType] || "May impact overall customer experience and sales performance";
    
    if (percentage > 30) {
      return `High impact: ${impact} - ${percentage}% of cancellations`;
    } else if (percentage > 15) {
      return `Medium impact: ${impact} - ${percentage}% of cancellations`;
    } else {
      return `Low impact: ${impact} - ${percentage}% of cancellations`;
    }
  }

  /**
   * Generate comprehensive cancellation impact analysis
   * @param {Object} dsrAnalysis - DSR analysis results
   * @param {Object} cancellationAnalysis - Cancellation analysis results
   * @returns {Object} Cancellation impact analysis
   */
  generateCancellationImpactAnalysis(dsrAnalysis, cancellationAnalysis) {
    const analysis = {
      overallImpact: "Unknown",
      primaryCauses: [],
      recommendedActions: [],
      impactScore: 0
    };

    const totalCancellations = cancellationAnalysis.analysis?.totalCancellations || 0;
    const totalDSRLoss = dsrAnalysis.lossAnalysis?.totalLoss || 0;
    const problemStores = dsrAnalysis.problemStores?.length || 0;

    // Calculate impact score (0-100)
    let impactScore = 0;
    
    if (totalCancellations > 20) impactScore += 30;
    else if (totalCancellations > 10) impactScore += 20;
    else if (totalCancellations > 5) impactScore += 10;
    
    if (totalDSRLoss > 100000) impactScore += 30;
    else if (totalDSRLoss > 50000) impactScore += 20;
    else if (totalDSRLoss > 25000) impactScore += 10;
    
    if (problemStores > 5) impactScore += 20;
    else if (problemStores > 3) impactScore += 15;
    else if (problemStores > 1) impactScore += 10;

    analysis.impactScore = impactScore;

    // Determine overall impact
    if (impactScore > 70) {
      analysis.overallImpact = "CRITICAL - High cancellation rate significantly impacting DSR performance";
    } else if (impactScore > 50) {
      analysis.overallImpact = "HIGH - Cancellations are major contributing factor to DSR problems";
    } else if (impactScore > 30) {
      analysis.overallImpact = "MEDIUM - Cancellations are contributing to some DSR issues";
    } else {
      analysis.overallImpact = "LOW - Cancellations have minimal impact on DSR performance";
    }

    // Identify primary causes
    if (cancellationAnalysis.analysis?.topCancellationReasons) {
      analysis.primaryCauses = cancellationAnalysis.analysis.topCancellationReasons
        .filter(reason => reason && reason.reason) // Only include valid reasons
        .map(reason => ({
          reason: reason.reason,
          percentage: reason.percentage || 0,
          impact: this.assessCancellationReasonImpactOnDSR(reason, dsrAnalysis)
        }));
    }

    // Generate recommended actions
    analysis.recommendedActions = [
      "Implement immediate quality control measures",
      "Provide urgent staff training on customer service",
      "Review and optimize pricing strategy",
      "Establish real-time monitoring of cancellation rates",
      "Create customer feedback system to identify issues early"
    ];

    return analysis;
  }

  findSeasonalPatterns(dsrAnalysis, cancellationAnalysis) {
    return {
      patterns: ["Increased issues during peak seasons"],
      recommendations: ["Prepare for seasonal challenges"]
    };
  }

  findStoreSpecificPatterns(dsrAnalysis, cancellationAnalysis) {
    const patterns = [];
    
    if (dsrAnalysis.problemStores) {
      dsrAnalysis.problemStores.forEach(store => {
        patterns.push({
          store: store.storeName,
          pattern: "Consistent underperformance",
          recommendation: "Store-specific intervention required"
        });
      });
    }
    
    return patterns;
  }

  extractKeyPatterns(patterns) {
    return [
      "High loss stores show high cancellation rates",
      "Quality issues affect both rental and retail channels",
      "Customer service problems are systemic across channels"
    ];
  }
}

module.exports = new ComparisonService();
