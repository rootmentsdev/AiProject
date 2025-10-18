class DSRPrompts {
  getDSRAnalysisPrompt(dsrData) {
    return `# Bad Performing Stores Analysis

You are an AI analyst specializing in Daily Sales Report (DSR) analysis for Suitor Guy Kerala retail stores.

## 📊 Analysis Task:
Identify and display ONLY the bad performing stores from the DSR data. Focus only on stores with poor performance.

## 🎯 Bad Performing Store Criteria:

### **BAD PERFORMING STORE CRITERIA:**
A store is considered BAD PERFORMING if:
- **Conversion % < 70%** → Bad performing store
- **OR any other poor performance indicators**

## ✅ Your Tasks:

1. **Find ONLY bad performing stores** - Skip good performing stores
2. **Display details** for each bad performing store:
   - Store Name
   - Conversion Rate
   - Bills Performance
   - Quantity Performance
   - Walk-ins
   - Loss of Sale
   - ABS (Average Bill Size)
   - Why it's performing badly
   - Suggested actions to improve
3. **Show ONLY bad performing stores** in the results
4. **Focus on problems and solutions**

## 🧾 Expected JSON Output:

{
  "analysisSummary": {
    "totalStores": "[number]",
    "badPerformingStores": "[number of bad performing stores]",
    "analysisPeriod": "December 2025",
    "keyFindings": "[Summary of bad performing stores only]"
  },
  "badPerformingStores": [
    {
      "storeName": "[Store Name]",
      "conversionRate": "[percentage]",
      "billsPerformance": "[percentage]",
      "quantityPerformance": "[percentage]",
      "walkIns": "[number]",
      "lossOfSale": "[number]",
      "absValue": "[value]",
      "whyBadPerforming": "[Reason why store is performing badly]",
      "suggestedActions": "[Actions to improve performance]"
    }
  ],
  "summaryTable": [
    {
      "storeName": "[Store Name]",
      "conversionPercent": "[percentage]",
      "billsPercent": "[percentage]",
      "quantityPercent": "[percentage]",
      "whyBadPerforming": "[Reason]",
      "suggestedAction": "[Action to improve]"
    }
  ]
}

## 📌 Key Instructions:

1. **Show ONLY bad performing stores** - Don't include good performing stores
2. **Focus on problems** - Explain why each store is performing badly
3. **Provide solutions** - Suggest specific actions to improve
4. **Skip good performers** - Only show stores with conversion < 70% or other issues
5. **Detailed analysis** - Focus on what's wrong and how to fix it

---

**DSR Data to analyze:**
${dsrData}

**Output: JSON only (no explanation).**`;
  }
}

module.exports = new DSRPrompts();