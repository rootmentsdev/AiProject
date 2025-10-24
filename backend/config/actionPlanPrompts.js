/**
 * AI Prompts for Action Plan Generation
 * Store all prompts in one place for easy management
 */

/**
 * Get action plan generation prompt
 * @param {Object} data - Analysis data including DSR and cancellation info
 * @returns {string} Formatted prompt
 */
function getActionPlanPrompt(data) {
  const { dsrProblems, storeCorrelations, totalLoss, totalCancellations } = data;
  
  let storeSpecificProblems = '';
  
  // If we have correlations (DSR + cancellations)
  if (storeCorrelations && storeCorrelations.length > 0) {
    storeSpecificProblems = storeCorrelations.map((store, index) => {
      let cancellationReasons = 'No cancellations on this date';
      
      if (store.topCancellationReasons && Array.isArray(store.topCancellationReasons) && store.topCancellationReasons.length > 0) {
        try {
          cancellationReasons = store.topCancellationReasons
            .map(r => {
              if (r && typeof r === 'object' && r.reason) {
                return `${r.reason} (${r.count || 0} times)`;
              }
              return null;
            })
            .filter(r => r !== null)
            .join(', ') || 'No cancellations on this date';
        } catch (err) {
          console.error("Error processing cancellation reasons:", err);
          cancellationReasons = 'No cancellations on this date';
        }
      }
      
      return `${index + 1}. **${store.store || 'Unknown Store'}**
   - DSR Issue: ${store.dsrIssue || 'Performance issue'}
   - Loss: ₹${store.dsrLoss || 0}
   - Cancellations on same date: ${store.cancellations || 0}
   - Main cancellation reasons: ${cancellationReasons}
   - Correlation: ${store.correlation || 'NONE'}`;
    }).join('\n\n');
  } 
  // If only DSR problems (no cancellations)
  else if (dsrProblems && dsrProblems.length > 0) {
    storeSpecificProblems = dsrProblems.map((problem, index) => {
      return `${index + 1}. **${problem.store}**
   - DSR Issue: ${problem.issue}
   - Loss: ₹${problem.loss}
   - Note: No cancellation data available for this date`;
    }).join('\n\n');
  } else {
    storeSpecificProblems = 'No problems identified in DSR analysis';
  }

  return `# Generate Targeted Action Plan

## Analysis Summary:
- Total Loss from DSR: ₹${totalLoss || 0}
- Total Cancellations on same date: ${totalCancellations || 0}
- Problem Stores: ${storeCorrelations?.length || 0}

## Store-Specific Problems (DSR + Cancellation Correlation):

${storeSpecificProblems}

## Your Task:
Generate a **SPECIFIC, ACTIONABLE** plan for each store based on DSR problems and any available cancellation data.

### Action Logic:

**If store has cancellations on this date:**
- "Low Conversion" + "Product not available/No product/Size not available/THEY WANT [product]" → **Action: Stock [specific product] at this store, increase inventory of [category]**
- "Low Conversion" + "CUSTOMER WANTS [specific item]" → **Action: Add [specific item] to inventory at this store**
- "Low Sales" + "PURCHASE FROM ANOTHER STORE/Price issue" → **Action: Review pricing strategy, competitive analysis**
- Problems + "BILL CHANGE/Billing issues" → **Action: Train staff on billing accuracy, implement double-check system**
- Problems + "PRODUCT CHANGE/Customer changed product" → **Action: Improve product display, staff consultation training**
- Problems + "FUNCTION CANCEL/Program cancelled" → **Action: Flexible policies, customer follow-up system**
- Problems + "RENTOUT NOT DONE" → **Action: Investigate why rentals aren't completing, improve fulfillment process**

**If NO cancellations on this date (still provide action plan):**
- "Low Conversion" → **Action: Analyze customer behavior, improve store experience, check product availability**
- "Low Sales" → **Action: Review pricing, marketing, staff performance, product quality**
- Any DSR problem → **Action: Investigate root cause, staff training, process improvement**

**IMPORTANT GUIDELINES**:
1. ALWAYS provide action plans for DSR problems, regardless of whether cancellations exist or not
2. When cancellation reason mentions a specific product (e.g., "THEY WANT SAREE FOR RENT"), extract the product name and include it in your action: "Stock sarees at [Store Name]"
3. Make actions STORE-SPECIFIC and PRODUCT-SPECIFIC when cancellation data provides this detail
4. If multiple stores have the same cancellation reason, provide the action for each store individually

## Output Format (JSON only, no explanation):

{
  "executiveSummary": {
    "totalLoss": "₹[amount]",
    "totalCancellations": "[number]",
    "criticalStores": "[number]",
    "priorityLevel": "HIGH/MEDIUM/LOW",
    "dateAnalyzed": "[date]"
  },
  "storeSpecificActions": [
    {
      "storeName": "[Store Name]",
      "dsrProblem": "[Problem from DSR]",
      "cancellationIssues": ["reason1", "reason2"],
      "rootCause": "[Specific diagnosis based on both DSR + cancellation data]",
      "immediateActions": [
        {
          "action": "[Specific action like 'Stock 50 more units of popular items']",
          "why": "[Why this action addresses both DSR problem and cancellation reason]",
          "timeline": "[timeframe]",
          "expectedImpact": "[Specific impact like '15% increase in conversion']"
        }
      ],
      "priority": "CRITICAL/HIGH/MEDIUM/LOW"
    }
  ],
  "generalRecommendations": [
    {
      "category": "INVENTORY/PRICING/STAFF/PROCESS",
      "recommendation": "[General recommendation]",
      "affectedStores": ["store1", "store2"],
      "timeline": "[timeframe]"
    }
  ]
}

**IMPORTANT**: Base ALL actions on the actual correlation data. If a store has "product not available" cancellations, recommend inventory actions. If "billing issues", recommend staff training.`;
}

/**
 * System prompt for action plan generation
 */
const ACTION_PLAN_SYSTEM_PROMPT = `You are an expert retail business analyst specializing in actionable recommendations. 

Your expertise:
- Identifying root causes by correlating different data sources
- Creating specific, measurable action plans
- Prioritizing actions based on business impact
- Focusing on practical, implementable solutions

Guidelines:
1. Always correlate DSR problems with cancellation reasons to find root causes
2. Provide SPECIFIC actions (not generic advice)
3. Include measurable outcomes
4. Consider resource constraints
5. Prioritize based on impact and feasibility`;

module.exports = {
  getActionPlanPrompt,
  ACTION_PLAN_SYSTEM_PROMPT
};

