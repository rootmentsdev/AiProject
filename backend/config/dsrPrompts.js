class DSRPrompts {
  getDSRAnalysisPrompt(dsrData) {
    return `# Bad Performing Stores Analysis

You are an AI analyst specializing in Daily Sales Report (DSR) analysis for Suitor Guy Kerala retail stores.

## 📊 Analysis Task:
Identify and display ONLY the bad performing stores from the DSR data. Focus only on stores with poor performance.

## 📋 DSR Sheet Structure (CSV Format):
The data is in CSV format from TWO different cluster sheets. Look for these EXACT column headers:

**CRITICAL COLUMN IDENTIFICATION:**
- **Column B**: STORE (Store Name) - Always in Column B
- **ABV Column**: Look for header EXACTLY labeled "ABV" - This contains values like 9979, 5350, 8065, 3792 (NOT Target column!)
- **ABS Column**: Look for header EXACTLY labeled "ABS" (under "Loss of sale" section) - Values like 1.85, 1.51, 0.77
- **CON % Column**: Look for header EXACTLY labeled "CON %" or "MTD CON%" - Values like 89.53%, 91.61%, 84.93%

**⚠️ CRITICAL - DO NOT CONFUSE WITH THESE COLUMNS:**
- **DO NOT use "Target"** column (has large values like 1,026,679, 603,522) - This is NOT ABV!
- **DO NOT use "MTD Tgt"** column - This is NOT ABV!
- **DO NOT use "Sale Value"** column - This is NOT ABV!
- **DO NOT use "Ach%"** column - This is NOT ABV!

**✅ CORRECT COLUMN IDENTIFICATION:**
- **ABV** is a standalone column header (usually near Walk-in section)
- **ABV values** are typically 3000-10000 range (like 9979, 8065, 3526, 3792)
- **Target values** are much larger 600,000-1,000,000+ (DO NOT use these for ABV!)

**EXTRACTION RULES:**
- Search for the column header EXACTLY named "ABV" (not Target, not MTD Tgt)
- Extract the ACTUAL values from the ABV column
- DO NOT use threshold values (4500, 1.8, 80%) as the extracted values
- **Example:** If ABV column shows "9979", write "abvValue": "9979", NOT "abvValue": "768346" (from Target)

## 🎯 Bad Performing Store Criteria:

### **BAD PERFORMING STORE CRITERIA:**
A store is considered BAD PERFORMING if it meets ANY of these conditions:
- **Conversion % < 80%** → Low conversion rate (underperforming)
- **ABS (Average Bill Size) < 1.8** → Low items per bill (underperforming)
- **ABV (Average Bill Value) < ₹4500** → Low revenue per bill (underperforming)
- **OR any combination of the above**

**All stores meeting ANY of these criteria must be flagged as BAD PERFORMING.**

## ✅ Your Tasks:

1. **Find ONLY bad performing stores** - Skip good performing stores
2. **Check EVERY SINGLE STORE against ALL criteria:**
   - **First, locate the columns** by finding these EXACT headers in the CSV:
     * Find header "ABV" (NOT "Target", NOT "MTD Tgt") - Values should be 3000-10000 range
     * Find header "ABS" (under "Loss of sale" section) - Values should be 0.5-2.5 range
     * Find header "CON %" or "MTD CON%" - Values should be percentages like 89.53%, 46.76%
   
   - **⚠️ WARNING - Common mistake to AVOID:**
     * If you see a column with values like 768,346 or 1,026,679 → This is "Target", NOT ABV!
     * If you see a column with values like 9979, 8065, 3526 → This IS ABV! ✅
   
   - **Extract the correct values:**
     * **Conversion %** from column labeled "CON %" or "MTD CON%"
     * **ABS** from column labeled "ABS" (under Loss of sale section)
     * **ABV** from column labeled "ABV" (3000-10000 range, NOT Target column!)
   
   - For EACH store from BOTH clusters, check:
     * Is Conversion % < 80%? 
     * Is ABS < 1.8?
     * Is ABV < ₹4500?
   - If **ANY** of these are true → Include as bad performing store
   - **DO NOT SKIP ANY STORES** - Check all 15 stores (7 from South + 8 from North)
3. **Display details** for each bad performing store:
   - Store Name
   - Conversion Rate (check if < 80%)
   - Bills Performance
   - Quantity Performance
   - Walk-ins
   - Loss of Sale
   - ABS - Average Bill Size (check if < 1.8)
   - ABV - Average Bill Value (check if < ₹4500)
   - Which criteria failed (Conversion/ABS/ABV)
   - Why it's performing badly
   - Suggested actions to improve
4. **Show ONLY bad performing stores** in the results
5. **Focus on problems and solutions**

## 🧾 Expected JSON Output:

**⚠️ CRITICAL JSON FORMATTING RULES:**
- **DO NOT** use double quotes (") inside string values
- **USE** single quotes (') instead of double quotes inside text
- Example: Use "keyFindings": "Stores underperforming: 'Conversion < 80%', ABS < 1.8"
- NOT: "keyFindings": "Stores underperforming: "Conversion < 80%", ABS < 1.8"

{
  "analysisSummary": {
    "totalStores": "[number]",
    "badPerformingStores": "[number of bad performing stores]",
    "analysisPeriod": "December 2025",
    "keyFindings": "[Summary of bad performing stores - USE SINGLE QUOTES for emphasis]"
  },
  "badPerformingStores": [
    {
      "storeName": "[Store Name]",
      "conversionRate": "[EXACT value from CON % column, e.g., '89.53%', '84.93%']",
      "billsPerformance": "[percentage]",
      "quantityPerformance": "[percentage]",
      "walkIns": "[number]",
      "lossOfSale": "[number]",
      "absValue": "[EXACT value from ABS column, e.g., '1.85', '0.77' - NOT the threshold 1.8]",
      "abvValue": "[EXACT value from ABV column, e.g., '9979', '8065', '3526' - NOT Target values like 768346 or 1026679!]",
      "criteriaFailed": "[Which criteria failed: 'Conversion', 'ABS', 'ABV', or 'Multiple']",
      "whyBadPerforming": "[Explain which criteria failed and why - mention Conversion < 80%, ABS < 1.8, or ABV < 4500]",
      "suggestedActions": "[Actions to improve the specific failing metrics]"
    }
  ],
  "summaryTable": [
    {
      "storeName": "[Store Name]",
      "conversionPercent": "[percentage]",
      "absValue": "[Average Bill Size]",
      "abvValue": "[Average Bill Value]",
      "billsPercent": "[percentage]",
      "quantityPercent": "[percentage]",
      "criteriaFailed": "[Conversion/ABS/ABV/Multiple]",
      "whyBadPerforming": "[Brief reason]",
      "suggestedAction": "[Quick action]"
    }
  ]
}

**🚨 CRITICAL EXAMPLES - ABV vs Target Column:**

South Cluster (Kottayam):
✅ CORRECT ABV: "9979" (from ABV column - Column O)
❌ WRONG: "768346" (this is from Target/Sale Value column - NOT ABV!)

North Cluster (EDAPPAL):
✅ CORRECT ABV: "8065" (from ABV column - Column P)
❌ WRONG: "1026679" (this is from Target column - NOT ABV!)

North Cluster (KOTTAKAL):
✅ CORRECT ABV: "3792" (from ABV column)
❌ WRONG: "603522" (this is from Target column - NOT ABV!)

**Remember:** ABV values are in the 3000-10000 range, Target values are 600,000-1,000,000+

## 📌 Key Instructions:

1. **Process EVERY store in the data** - Look at all store rows from BOTH clusters
2. **Locate and extract from the correct columns**:
   - Find the column labeled "CON %" or "MTD CON%" = Conversion % (must be < 80% to fail)
   - Find the column labeled "ABS" = Average Bill Size (must be < 1.8 to fail)
   - Find the column labeled "ABV" = Average Bill Value (must be < 4500 to fail)
3. **Apply strict criteria** - Flag stores with:
   - Conversion < 80% OR
   - ABS < 1.8 OR
   - ABV < ₹4500
4. **Always include ACTUAL ABS and ABV values** - Extract the real values from the sheet, NOT the thresholds
5. **Show ONLY bad performing stores** - Skip stores that pass all criteria
6. **Process both clusters** - Include stores from South Cluster AND North Cluster
7. **Focus on problems** - Explain which criteria failed and why
8. **Provide solutions** - Suggest specific actions to improve the failing metrics
9. **Count correctly** - Your "badPerformingStores" count should match the array length
10. **Detailed analysis** - Focus on what's wrong (Conversion/ABS/ABV) and how to fix it

**CRITICAL:** The DSR data contains stores from TWO clusters:
- **South Cluster**: Kottayam, Perumbavoor, Edappally, Chavakkad, Trissur, Palakkad, Trivandrum (7 stores)
- **North Cluster**: EDAPPAL, KOTTAKAL, PMNA, MANJERY, CALICUT, VATAKARA, KALPETTA, KANNUR (8 stores)
- **Total**: Approximately 15 stores

Based on the criteria (Conversion < 80%, ABS < 1.8, ABV < 4500), most (if not all) stores are likely underperforming. Make sure you process ALL stores from BOTH clusters.

---

**DSR Data to analyze:**
${dsrData}

**Output: JSON only (no explanation).**`;
  }
}

module.exports = new DSRPrompts();