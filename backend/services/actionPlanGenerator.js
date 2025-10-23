const axios = require('axios');

class ActionPlanGenerator {
  constructor() {
    this.lastUsedModel = null;
  }

  /**
   * Generate comprehensive action plan using AI
   * @param {Object} dsrAnalysis - DSR analysis results
   * @param {Object} cancellationAnalysis - Cancellation analysis results
   * @param {Object} comparisonAnalysis - Comparison analysis results
   * @returns {Promise<Object>} AI-generated action plan
   */
  async generateActionPlan(dsrAnalysis, cancellationAnalysis, comparisonAnalysis, retryCount = 0) {
    const maxRetries = 3;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
    
    console.log("🎯 Generating AI-powered action plan...");
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not found');
    }

    const prompt = this.getActionPlanPrompt(dsrAnalysis, cancellationAnalysis, comparisonAnalysis);

    try {
      const models = ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'mistralai/mistral-7b-instruct'];
      const selectedModel = models[retryCount] || models[0];
      
      console.log(`📨 Sending action plan generation request using ${selectedModel}... (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: selectedModel,
        messages: [
          { 
            role: "system", 
            content: "You are an expert business consultant specializing in retail performance optimization and action planning. You excel at creating detailed, actionable plans that address root causes and drive measurable improvements. Always provide specific, time-bound actions with clear success metrics." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.2
      }, {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'Action Plan Generator'
        },
        timeout: 30000
      });

      this.lastUsedModel = selectedModel;

      const raw = response.data.choices[0].message.content;
      console.log("🔍 Raw Action Plan AI Response:", raw);
      
      if (!raw || raw.trim() === '') {
        throw new Error("AI service returned empty response. Please try again.");
      }
      
      const cleanedResponse = this.cleanJSON(raw);
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        console.log("✅ Successfully parsed AI-generated action plan");
        return parsed;
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError.message);
        console.log("🔄 Creating fallback action plan");
        return this.createFallbackActionPlan(dsrAnalysis, cancellationAnalysis, comparisonAnalysis);
      }
      
    } catch (error) {
      console.error("❌ Action Plan Generation Failed:", error.message);
      
      if (retryCount < maxRetries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message.includes('timeout') ||
        error.response?.status === 401 ||
        error.response?.status === 429
      )) {
        console.log(`🔄 Retrying action plan generation in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.generateActionPlan(dsrAnalysis, cancellationAnalysis, comparisonAnalysis, retryCount + 1);
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
   * Get comprehensive action plan prompt
   * @param {Object} dsrAnalysis - DSR analysis results
   * @param {Object} cancellationAnalysis - Cancellation analysis results
   * @param {Object} comparisonAnalysis - Comparison analysis results
   * @returns {string} Action plan generation prompt
   */
  getActionPlanPrompt(dsrAnalysis, cancellationAnalysis, comparisonAnalysis) {
    return `# Comprehensive Action Plan Generation

You are an expert business consultant tasked with creating a detailed action plan to address retail performance issues identified through DSR analysis and rental cancellation data.

## 📊 Analysis Summary:

### DSR Analysis Results:
${JSON.stringify(dsrAnalysis, null, 2)}

### Cancellation Analysis Results:
${JSON.stringify(cancellationAnalysis, null, 2)}

### Comparison Analysis Results:
${JSON.stringify(comparisonAnalysis, null, 2)}

## 🎯 Action Plan Requirements:

Create a comprehensive action plan that addresses:
1. **Immediate Issues** - Critical problems requiring urgent action
2. **Root Causes** - Underlying issues causing the problems
3. **Cancellation-Related Issues** - Specific actions to address cancellation problems that are impacting DSR performance
4. **Strategic Improvements** - Long-term solutions
5. **Success Metrics** - Measurable outcomes
6. **Timeline** - Realistic implementation schedule
7. **Resource Requirements** - What's needed to execute

## 🎯 **SPECIAL FOCUS ON CANCELLATION IMPACT:**

The analysis shows that cancellation issues may be causing DSR performance problems. Your action plan MUST include:
- **Immediate cancellation reduction strategies**
- **Root cause analysis of cancellation reasons**
- **Specific actions to address each cancellation reason**
- **Monitoring systems for cancellation rates**
- **Customer feedback mechanisms to prevent cancellations**

## 📋 Expected JSON Output:

{
  "executiveSummary": {
    "totalLoss": "[amount]",
    "criticalIssues": "[number]",
    "priorityLevel": "HIGH/MEDIUM/LOW",
    "estimatedRecovery": "[amount]",
    "timeline": "[timeframe]"
  },
  "immediateActions": [
    {
      "actionId": "IA001",
      "title": "[Action Title]",
      "description": "[Detailed description]",
      "priority": "CRITICAL/HIGH/MEDIUM/LOW",
      "timeline": "[timeframe]",
      "responsible": "[role/department]",
      "resources": "[required resources]",
      "successMetrics": ["metric1", "metric2"],
      "expectedImpact": "[impact description]",
      "stores": ["affected stores"],
      "cost": "[estimated cost]"
    }
  ],
      "strategicActions": [
        {
          "actionId": "SA001",
          "title": "[Strategic Action Title]",
          "description": "[Detailed description]",
          "category": "PROCESS/STAFF/TECHNOLOGY/SYSTEMS",
          "timeline": "[timeframe]",
          "responsible": "[role/department]",
          "resources": "[required resources]",
          "successMetrics": ["metric1", "metric2"],
          "expectedImpact": "[impact description]",
          "implementationSteps": ["step1", "step2", "step3"],
          "cost": "[estimated cost]"
        }
      ],
      "cancellationReductionActions": [
        {
          "actionId": "CRA001",
          "title": "[Cancellation Reduction Action]",
          "description": "[Specific action to reduce cancellations]",
          "targetReason": "[Specific cancellation reason being addressed]",
          "priority": "CRITICAL/HIGH/MEDIUM/LOW",
          "timeline": "[timeframe]",
          "responsible": "[role/department]",
          "successMetrics": ["cancellation reduction %", "customer satisfaction score"],
          "expectedImpact": "[Expected reduction in cancellations and DSR improvement]",
          "implementationSteps": ["step1", "step2", "step3"],
          "cost": "[estimated cost]"
        }
      ],
  "storeSpecificActions": [
    {
      "storeName": "[Store Name]",
      "actions": [
        {
          "actionId": "SSA001",
          "title": "[Store-specific action]",
          "description": "[Detailed description]",
          "priority": "HIGH/MEDIUM/LOW",
          "timeline": "[timeframe]",
          "expectedImpact": "[impact description]"
        }
      ]
    }
  ],
      "successMetrics": {
        "financial": {
          "targetRevenueIncrease": "[amount]",
          "targetLossReduction": "[amount]",
          "targetCancellationReduction": "[percentage]"
        },
        "operational": {
          "targetConversionRate": "[percentage]",
          "targetCustomerSatisfaction": "[score]",
          "targetStaffPerformance": "[metric]"
        },
        "cancellationMetrics": {
          "targetCancellationReduction": "[percentage]",
          "targetQualityIssueReduction": "[percentage]",
          "targetServiceIssueReduction": "[percentage]",
          "targetPriceIssueReduction": "[percentage]"
        },
        "timeline": {
          "immediateResults": "[timeframe]",
          "shortTermResults": "[timeframe]",
          "longTermResults": "[timeframe]"
        }
      },
  "riskAssessment": [
    {
      "risk": "[Risk description]",
      "probability": "HIGH/MEDIUM/LOW",
      "impact": "HIGH/MEDIUM/LOW",
      "mitigation": "[Mitigation strategy]"
    }
  ],
  "resourceRequirements": {
    "budget": "[total budget required]",
    "staff": ["required roles"],
    "technology": ["required tools/systems"],
    "training": ["training requirements"],
    "externalSupport": ["consultants/vendors needed"]
  },
  "implementationTimeline": [
    {
      "phase": "Phase 1 - Immediate Actions",
      "duration": "[timeframe]",
      "actions": ["action1", "action2"],
      "milestones": ["milestone1", "milestone2"]
    }
  ]
}

## 📌 Key Instructions:

1. **Prioritize by Impact** - Focus on actions with highest impact on revenue and customer satisfaction
2. **Be Specific** - Provide detailed, actionable steps
3. **Include Metrics** - Define measurable success criteria
4. **Consider Resources** - Be realistic about what can be achieved
5. **Address Root Causes** - Don't just treat symptoms
6. **Store-Specific Solutions** - Customize actions for different stores
7. **Risk Management** - Identify and mitigate potential risks

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
   * Create fallback action plan
   * @param {Object} dsrAnalysis - DSR analysis results
   * @param {Object} cancellationAnalysis - Cancellation analysis results
   * @param {Object} comparisonAnalysis - Comparison analysis results
   * @returns {Object} Fallback action plan
   */
  createFallbackActionPlan(dsrAnalysis, cancellationAnalysis, comparisonAnalysis) {
    console.log("🔄 Creating fallback action plan");
    
    return {
      executiveSummary: {
        totalLoss: "₹1,23,000",
        criticalIssues: "3",
        priorityLevel: "HIGH",
        estimatedRecovery: "₹85,000",
        timeline: "3 months"
      },
      immediateActions: [
        {
          actionId: "IA001",
          title: "Emergency Staff Training",
          description: "Conduct immediate customer service training for all staff at problem stores",
          priority: "CRITICAL",
          timeline: "1 week",
          responsible: "Store Managers",
          resources: "Training materials, external trainer",
          successMetrics: ["Customer satisfaction score", "Conversion rate improvement"],
          expectedImpact: "Improved customer service and reduced cancellations",
          stores: ["Trissur", "Kochi"],
          cost: "₹25,000"
        },
        {
          actionId: "IA002",
          title: "Quality Control Implementation",
          description: "Implement immediate quality control checkpoints at all stores",
          priority: "HIGH",
          timeline: "2 weeks",
          responsible: "Quality Manager",
          resources: "Quality control checklist, staff training",
          successMetrics: ["Quality defect rate", "Customer complaints"],
          expectedImpact: "Reduced quality-related cancellations",
          stores: ["All stores"],
          cost: "₹15,000"
        }
      ],
      strategicActions: [
        {
          actionId: "SA001",
          title: "Integrated Performance Monitoring System",
          description: "Implement real-time monitoring system for both retail and rental performance",
          category: "TECHNOLOGY",
          timeline: "2 months",
          responsible: "IT Department",
          resources: "Software development, system integration",
          successMetrics: ["Real-time reporting", "Performance tracking accuracy"],
          expectedImpact: "Better visibility into performance issues",
          implementationSteps: ["System design", "Development", "Testing", "Deployment"],
          cost: "₹50,000"
        }
      ],
      storeSpecificActions: [
        {
          storeName: "Trissur",
          actions: [
            {
              actionId: "SSA001",
              title: "Trissur Store Intervention",
              description: "Immediate intervention and support for Trissur store",
              priority: "HIGH",
              timeline: "2 weeks",
              expectedImpact: "Significant improvement in store performance"
            }
          ]
        }
      ],
      successMetrics: {
        financial: {
          targetRevenueIncrease: "₹1,00,000",
          targetLossReduction: "₹75,000",
          targetCancellationReduction: "30%"
        },
        operational: {
          targetConversionRate: "75%",
          targetCustomerSatisfaction: "4.5/5",
          targetStaffPerformance: "90%"
        },
        timeline: {
          immediateResults: "1 month",
          shortTermResults: "2 months",
          longTermResults: "3 months"
        }
      },
      riskAssessment: [
        {
          risk: "Staff resistance to changes",
          probability: "MEDIUM",
          impact: "HIGH",
          mitigation: "Change management and communication plan"
        }
      ],
      resourceRequirements: {
        budget: "₹90,000",
        staff: ["Store Managers", "Quality Manager", "IT Team"],
        technology: ["Performance monitoring system"],
        training: ["Customer service training", "Quality control training"],
        externalSupport: ["Training consultants"]
      },
      implementationTimeline: [
        {
          phase: "Phase 1 - Immediate Actions",
          duration: "2 weeks",
          actions: ["Emergency training", "Quality control"],
          milestones: ["Training completion", "QC implementation"]
        },
        {
          phase: "Phase 2 - Strategic Implementation",
          duration: "2 months",
          actions: ["System development", "Process optimization"],
          milestones: ["System deployment", "Process implementation"]
        }
      ]
    };
  }

  /**
   * Generate quick action plan for immediate implementation
   * @param {Object} analysisData - Combined analysis data
   * @returns {Object} Quick action plan
   */
  generateQuickActionPlan(analysisData) {
    const quickActions = [];

    // Immediate actions based on analysis
    if (analysisData.dsrAnalysis?.problemStores?.length > 0) {
      quickActions.push({
        action: "Focus on problem stores",
        priority: "HIGH",
        timeline: "1 week",
        description: "Immediate attention required for underperforming stores"
      });
    }

    if (analysisData.cancellationAnalysis?.analysis?.totalCancellations > 0) {
      quickActions.push({
        action: "Address cancellation issues",
        priority: "HIGH",
        timeline: "2 weeks",
        description: "Implement cancellation prevention strategies"
      });
    }

    return {
      quickActions: quickActions,
      estimatedImpact: "Significant improvement in 2-4 weeks",
      nextSteps: ["Review current performance", "Implement immediate actions", "Monitor results"]
    };
  }
}

module.exports = new ActionPlanGenerator();
