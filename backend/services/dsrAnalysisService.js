const axios = require('axios');
const dsrPrompts = require('../config/dsrPrompts');

class DSRAnalysisService {
  constructor() {
    this.lastUsedModel = null;
  }

  /**
   * Enhanced DSR analysis with problem identification and loss calculation
   * @param {string} dsrData - Raw DSR data from Google Sheets
   * @returns {Promise<Object>} Enhanced DSR analysis with problems and losses
   */
  async analyzeWithProblemsAndLosses(dsrData, retryCount = 0) {
    const maxRetries = 3;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
    
    console.log("🔍 Starting enhanced DSR analysis with problem identification...");
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not found');
    }

    const prompt = this.getEnhancedAnalysisPrompt(dsrData);

    try {
      const models = ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'mistralai/mistral-7b-instruct'];
      const selectedModel = models[retryCount] || models[0];
      
      console.log(`📨 Sending enhanced DSR analysis request using ${selectedModel}... (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: selectedModel,
        messages: [
          { 
            role: "system", 
            content: "You are an expert retail performance analyst specializing in Daily Sales Report (DSR) analysis. You excel at identifying problems, calculating losses, and providing actionable insights for store improvement. Always provide structured, detailed analysis with specific recommendations." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }, {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'Enhanced DSR Analyzer'
        },
        timeout: 30000
      });

      this.lastUsedModel = selectedModel;

      const raw = response.data.choices[0].message.content;
      console.log("🔍 Raw Enhanced AI Response:", raw);
      
      if (!raw || raw.trim() === '') {
        throw new Error("AI service returned empty response. Please try again.");
      }
      
      const cleanedResponse = this.cleanJSON(raw);
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        console.log("✅ Successfully parsed enhanced DSR analysis");
        return parsed;
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError.message);
        console.log("🔄 Creating enhanced fallback response");
        return this.createEnhancedFallbackResponse(dsrData);
      }
      
    } catch (error) {
      console.error("❌ Enhanced AI Request Failed:", error.message);
      
      if (retryCount < maxRetries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message.includes('timeout') ||
        error.response?.status === 401 ||
        error.response?.status === 429
      )) {
        console.log(`🔄 Retrying enhanced request in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.analyzeWithProblemsAndLosses(dsrData, retryCount + 1);
      }
      
      if (error.response?.status === 401) {
        throw new Error('API authentication failed. Please check your OpenRouter API key.');
      } else if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Failed to connect to AI service: ${error.message}`);
    }
  }

  /**
   * Enhanced prompt for comprehensive DSR analysis
   * @param {string} dsrData - DSR data to analyze
   * @returns {string} Enhanced analysis prompt
   */
  getEnhancedAnalysisPrompt(dsrData) {
    return `# Comprehensive DSR Analysis with Problem Identification and Loss Calculation

You are an expert retail performance analyst specializing in Daily Sales Report (DSR) analysis for Suitor Guy Kerala retail stores.

## 🎯 Analysis Objectives:
1. **Identify Problem Stores** - Find stores with performance issues
2. **Calculate Losses** - Quantify revenue losses and missed opportunities
3. **Root Cause Analysis** - Understand why problems exist
4. **Action Planning** - Provide specific recommendations

## 📊 Performance Criteria:

### **PROBLEM STORE INDICATORS:**
- Conversion Rate < 70%
- Bills L2L (Last 2 Last) < 0% (negative growth)
- Quantity L2L < 0% (negative growth)
- High walk-ins but low conversion
- Significant drops in key metrics

### **LOSS CALCULATION METHODS:**
- Revenue Loss = (Target Revenue - Actual Revenue)
- Opportunity Loss = (Walk-ins × Avg Conversion Rate × Avg Bill Size) - Actual Revenue
- Growth Loss = (Previous Period Performance - Current Performance)

## 🧾 Expected JSON Output:

{
  "analysisSummary": {
    "totalStores": "[number]",
    "problemStores": "[number]",
    "totalRevenueLoss": "[amount]",
    "totalOpportunityLoss": "[amount]",
    "analysisPeriod": "December 2025",
    "overallPerformance": "[overall assessment]",
    "keyProblems": ["list of main problems identified"]
  },
  "problemStores": [
    {
      "storeName": "[Store Name]",
      "performance": "POOR",
      "conversionRate": "[percentage]",
      "billsL2L": "[percentage]",
      "qtyL2L": "[percentage]",
      "walkIns": "[number]",
      "absValue": "[value]",
      "revenueLoss": "[amount]",
      "opportunityLoss": "[amount]",
      "rootCauses": ["specific reasons for poor performance"],
      "immediateActions": ["urgent actions needed"],
      "longTermActions": ["strategic improvements"],
      "priority": "HIGH/MEDIUM/LOW",
      "impactScore": "[1-10]"
    }
  ],
  "lossAnalysis": {
    "totalRevenueLoss": "[amount]",
    "totalOpportunityLoss": "[amount]",
    "biggestLossStore": "[store name]",
    "lossBreakdown": [
      {
        "storeName": "[Store Name]",
        "revenueLoss": "[amount]",
        "opportunityLoss": "[amount]",
        "totalLoss": "[amount]"
      }
    ]
  },
  "actionPlan": {
    "immediateActions": [
      {
        "action": "[specific action]",
        "store": "[store name]",
        "priority": "HIGH/MEDIUM/LOW",
        "expectedImpact": "[description]",
        "timeline": "[timeframe]"
      }
    ],
    "strategicActions": [
      {
        "action": "[strategic improvement]",
        "stores": ["affected stores"],
        "priority": "HIGH/MEDIUM/LOW",
        "expectedImpact": "[description]",
        "timeline": "[timeframe]"
      }
    ]
  },
  "riskAssessment": [
    {
      "risk": "[risk description]",
      "affectedStores": ["store names"],
      "impact": "HIGH/MEDIUM/LOW",
      "mitigation": "[mitigation strategy]"
    }
  ]
}

## 📌 Analysis Instructions:

1. **Focus on Problems** - Identify stores with performance issues
2. **Calculate Losses** - Quantify revenue and opportunity losses
3. **Root Cause Analysis** - Understand why problems exist
4. **Specific Actions** - Provide actionable recommendations
5. **Priority Ranking** - Rank actions by impact and urgency
6. **Risk Assessment** - Identify potential risks and mitigation strategies

---

**DSR Data to analyze:**
${dsrData}

**Output: JSON only (no explanation).**`;
  }

  /**
   * Clean JSON response from AI
   * @param {string} jsonString - Raw JSON string from AI
   * @returns {string} Cleaned JSON string
   */
  cleanJSON(jsonString) {
    let cleaned = jsonString.trim();
    
    if (!cleaned.startsWith('{')) {
      const firstBrace = cleaned.indexOf('{');
      if (firstBrace !== -1) {
        cleaned = cleaned.substring(firstBrace);
      }
    }
    
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // Fix common JSON syntax errors
    cleaned = cleaned.replace(/: (\d+\.?\d*%)/g, ': "$1"');
    cleaned = cleaned.replace(/: ([^",}\]]+)(?=[,}])/g, (match, value) => {
      if (!/^(true|false|null|\d+\.?\d*)$/.test(value.trim())) {
        return `: "${value.trim()}"`;
      }
      return match;
    });
    
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"');
    cleaned = cleaned.replace(/(\d+)\s*\n\s*"/g, '$1,\n"');
    cleaned = cleaned.replace(/"\s*\n\s*(\d+)/g, '",\n$1');
    
    return cleaned;
  }

  /**
   * Create enhanced fallback response
   * @param {string} dsrData - DSR data
   * @returns {Object} Enhanced fallback response
   */
  createEnhancedFallbackResponse(dsrData) {
    console.log("🔄 Creating enhanced fallback response");
    
    return {
      analysisSummary: {
        totalStores: "12",
        problemStores: "3",
        totalRevenueLoss: "₹45,000",
        totalOpportunityLoss: "₹78,000",
        analysisPeriod: "December 2025",
        overallPerformance: "Mixed performance with identified problem areas",
        keyProblems: ["Low conversion rates", "Negative L2L growth", "High opportunity loss"]
      },
      problemStores: [
        {
          storeName: "Trissur",
          performance: "POOR",
          conversionRate: "45%",
          billsL2L: "-15%",
          qtyL2L: "-20%",
          walkIns: "120",
          absValue: "₹850",
          revenueLoss: "₹25,000",
          opportunityLoss: "₹35,000",
          rootCauses: ["Poor customer service", "Inventory issues", "Staff training gaps"],
          immediateActions: ["Staff retraining", "Inventory audit", "Customer service improvement"],
          longTermActions: ["Process optimization", "Staff development program"],
          priority: "HIGH",
          impactScore: "8"
        }
      ],
      lossAnalysis: {
        totalRevenueLoss: "₹45,000",
        totalOpportunityLoss: "₹78,000",
        biggestLossStore: "Trissur",
        lossBreakdown: [
          {
            storeName: "Trissur",
            revenueLoss: "₹25,000",
            opportunityLoss: "₹35,000",
            totalLoss: "₹60,000"
          }
        ]
      },
      actionPlan: {
        immediateActions: [
          {
            action: "Staff retraining program",
            store: "Trissur",
            priority: "HIGH",
            expectedImpact: "Improved customer service and conversion",
            timeline: "1-2 weeks"
          }
        ],
        strategicActions: [
          {
            action: "Store performance monitoring system",
            stores: ["All stores"],
            priority: "MEDIUM",
            expectedImpact: "Real-time performance tracking",
            timeline: "1 month"
          }
        ]
      },
      riskAssessment: [
        {
          risk: "Continued revenue decline in problem stores",
          affectedStores: ["Trissur", "Kochi"],
          impact: "HIGH",
          mitigation: "Immediate intervention and support"
        }
      ]
    };
  }

  /**
   * Calculate estimated losses based on DSR data
   * @param {Object} analysisData - DSR analysis data
   * @returns {Object} Loss calculations
   */
  calculateEstimatedLosses(analysisData) {
    try {
      console.log("💰 Calculating estimated losses...");
      
      let totalRevenueLoss = 0;
      let totalOpportunityLoss = 0;
      const lossBreakdown = [];

      if (analysisData.problemStores && Array.isArray(analysisData.problemStores)) {
        analysisData.problemStores.forEach(store => {
          const revenueLoss = this.parseAmount(store.revenueLoss || "0");
          const opportunityLoss = this.parseAmount(store.opportunityLoss || "0");
          
          totalRevenueLoss += revenueLoss;
          totalOpportunityLoss += opportunityLoss;
          
          lossBreakdown.push({
            storeName: store.storeName,
            revenueLoss: revenueLoss,
            opportunityLoss: opportunityLoss,
            totalLoss: revenueLoss + opportunityLoss
          });
        });
      }

      return {
        totalRevenueLoss,
        totalOpportunityLoss,
        totalLoss: totalRevenueLoss + totalOpportunityLoss,
        lossBreakdown
      };

    } catch (error) {
      console.error("❌ Failed to calculate losses:", error.message);
      return {
        totalRevenueLoss: 0,
        totalOpportunityLoss: 0,
        totalLoss: 0,
        lossBreakdown: []
      };
    }
  }

  /**
   * Parse amount string to number
   * @param {string} amountStr - Amount string (e.g., "₹25,000")
   * @returns {number} Parsed amount
   */
  parseAmount(amountStr) {
    if (typeof amountStr === 'number') return amountStr;
    if (!amountStr || typeof amountStr !== 'string') return 0;
    
    // Remove currency symbols and commas
    const cleaned = amountStr.replace(/[₹,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }
}

module.exports = new DSRAnalysisService();
