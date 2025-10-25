# 🎯 DSR Analysis Criteria Update - Complete Implementation

## 📋 What You Requested

Update the DSR analysis to identify underperforming stores based on **NEW STRICTER CRITERIA**:

### **OLD Criteria:**
- ❌ Conversion < 70% only

### **NEW Criteria:**
- ✅ **Conversion < 80%** (increased threshold)
- ✅ **ABS (Average Bill Size) < 1.8** (new metric)
- ✅ **ABV (Average Bill Value) < ₹4500** (new metric)

**Any store meeting ANY of these criteria = BAD PERFORMING STORE**

---

## ✅ All Changes Implemented

### 1. Backend AI Prompt Updated ✅

**File:** `backend/config/dsrPrompts.js`

**Changes:**

#### A. Updated Criteria Definition (Lines 10-19)
```javascript
## 🎯 Bad Performing Store Criteria:

### **BAD PERFORMING STORE CRITERIA:**
A store is considered BAD PERFORMING if it meets ANY of these conditions:
- **Conversion % < 80%** → Low conversion rate (underperforming)
- **ABS (Average Bill Size) < 1.8** → Low items per bill (underperforming)
- **ABV (Average Bill Value) < ₹4500** → Low revenue per bill (underperforming)
- **OR any combination of the above**

**All stores meeting ANY of these criteria must be flagged as BAD PERFORMING.**
```

#### B. Updated Task Instructions (Lines 23-42)
```javascript
1. **Find ONLY bad performing stores** - Skip good performing stores
2. **Check each store against the criteria:**
   - Is Conversion % < 80%? 
   - Is ABS < 1.8?
   - Is ABV < ₹4500?
   - If ANY of these are true → Include as bad performing store
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
```

#### C. Updated JSON Output Format (Lines 53-80)
```javascript
"badPerformingStores": [
  {
    "storeName": "[Store Name]",
    "conversionRate": "[percentage - must show if < 80%]",
    "billsPerformance": "[percentage]",
    "quantityPerformance": "[percentage]",
    "walkIns": "[number]",
    "lossOfSale": "[number]",
    "absValue": "[Average Bill Size - must show if < 1.8]",
    "abvValue": "[Average Bill Value in ₹ - must show if < 4500]",
    "criteriaFailed": "[Which criteria failed: 'Conversion', 'ABS', 'ABV', or 'Multiple']",
    "whyBadPerforming": "[Explain which criteria failed and why]",
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
```

#### D. Updated Key Instructions (Lines 85-94)
```javascript
1. **Show ONLY bad performing stores** - Don't include good performing stores
2. **Apply strict criteria** - Flag stores with:
   - Conversion < 80% OR
   - ABS < 1.8 OR
   - ABV < ₹4500
3. **Always include ABS and ABV values** - Extract these from the DSR data
4. **Focus on problems** - Explain which criteria failed and why
5. **Provide solutions** - Suggest specific actions to improve the failing metrics
6. **Skip good performers** - Only show stores meeting the bad performing criteria
7. **Detailed analysis** - Focus on what's wrong (Conversion/ABS/ABV) and how to fix it
```

---

### 2. Frontend Dashboard Updated ✅

**File:** `frontend/src/components/DSRAnalysisDashboard.jsx`

**Changes:**

#### A. Updated Data Mapping (Lines 71-81)
```javascript
return data.badPerformingStores.map((store, index) => ({
  id: index + 1,
  storeName: store.storeName,
  conversionRate: store.conversionRate,
  absValue: store.absValue || 'N/A',          // ← NEW
  abvValue: store.abvValue || 'N/A',          // ← NEW
  criteriaFailed: store.criteriaFailed || 'Performance', // ← NEW
  issue: `Low Performance (${store.conversionRate})`,
  rootCause: store.whyBadPerforming || 'Performance issues identified',
  actions: store.suggestedActions || 'Implement improvement strategies'
}));
```

#### B. Updated CSV Export (Lines 94-106)
```javascript
const headers = [
  '#', 
  'Store Name', 
  'Conversion Rate', 
  'ABS',              // ← NEW
  'ABV',              // ← NEW
  'Criteria Failed',  // ← NEW
  'Root Cause', 
  'Recommended Actions'
];

const csvRows = issuesData.map(item => [
  item.id,
  `"${item.storeName}"`,
  `"${item.conversionRate}"`,
  `"${item.absValue}"`,         // ← NEW
  `"${item.abvValue}"`,         // ← NEW
  `"${item.criteriaFailed}"`,   // ← NEW
  `"${item.rootCause.replace(/"/g, '""')}"`,
  `"${item.actions.replace(/"/g, '""')}"`
]);
```

#### C. Updated Table Headers (Lines 203-228)
```javascript
<thead className="bg-light">
  <tr>
    <th width="5%">#</th>
    <th width="15%">
      <i className="fas fa-store me-2"></i>Store Name
    </th>
    <th width="10%">
      <i className="fas fa-percentage me-2"></i>Conv%
    </th>
    <th width="8%">                          {/* ← NEW */}
      <i className="fas fa-shopping-cart me-2"></i>ABS
    </th>
    <th width="10%">                         {/* ← NEW */}
      <i className="fas fa-rupee-sign me-2"></i>ABV
    </th>
    <th width="12%">                         {/* ← NEW */}
      <i className="fas fa-flag me-2"></i>Issue
    </th>
    <th width="20%">
      <i className="fas fa-search me-2"></i>Root Cause
    </th>
    <th width="20%">
      <i className="fas fa-tools me-2"></i>Actions
    </th>
  </tr>
</thead>
```

#### D. Updated Table Body with NEW Columns (Lines 251-297)
```javascript
{/* Conversion Rate - Updated threshold */}
<td className="py-3 text-center">
  <Badge 
    bg={parseFloat(item.conversionRate) < 50 ? 'danger' : 
        parseFloat(item.conversionRate) < 80 ? 'warning' : 'success'}  {/* Changed from 70 to 80 */}
    className="px-3 py-2"
  >
    {item.conversionRate}
  </Badge>
</td>

{/* ABS - NEW COLUMN */}
<td className="py-3 text-center">
  <Badge 
    bg={parseFloat(item.absValue) < 1.8 ? 'danger' : 'secondary'}
    className="px-2 py-1"
  >
    {item.absValue}
  </Badge>
</td>

{/* ABV - NEW COLUMN */}
<td className="py-3 text-center">
  <Badge 
    bg={parseFloat(item.abvValue) < 4500 ? 'danger' : 'secondary'}
    className="px-2 py-1"
  >
    ₹{item.abvValue}
  </Badge>
</td>

{/* Criteria Failed - NEW COLUMN */}
<td className="py-3 text-center">
  <Badge 
    bg={
      item.criteriaFailed === 'Multiple' ? 'danger' :
      item.criteriaFailed === 'Conversion' ? 'warning' :
      item.criteriaFailed === 'ABS' ? 'info' :
      item.criteriaFailed === 'ABV' ? 'primary' : 'secondary'
    }
    className="px-2"
  >
    {item.criteriaFailed}
  </Badge>
</td>
```

---

## 🎨 Visual Improvements

### Badge Color Coding:

**Conversion Rate:**
- 🔴 **Red (Danger)**: < 50%
- 🟡 **Yellow (Warning)**: 50% - 79.99%
- 🟢 **Green (Success)**: ≥ 80%

**ABS (Average Bill Size):**
- 🔴 **Red (Danger)**: < 1.8
- ⚫ **Gray (Secondary)**: ≥ 1.8

**ABV (Average Bill Value):**
- 🔴 **Red (Danger)**: < ₹4500
- ⚫ **Gray (Secondary)**: ≥ ₹4500

**Criteria Failed:**
- 🔴 **Red (Danger)**: Multiple criteria failed
- 🟡 **Yellow (Warning)**: Conversion failed
- 🔵 **Blue (Info)**: ABS failed
- 🟣 **Purple (Primary)**: ABV failed
- ⚫ **Gray (Secondary)**: Other

---

## 📊 Expected Output

### **Example of NEW DSR Analysis:**

**DSR Sheet Data:**
| Store | Conversion | ABS | ABV |
|-------|-----------|-----|-----|
| Store A | 75% | 1.5 | ₹4200 |
| Store B | 85% | 2.0 | ₹5000 |
| Store C | 78% | 1.9 | ₹3800 |
| Store D | 82% | 1.6 | ₹4800 |

**Analysis Result:**

**Bad Performing Stores (3 found):**

1. **Store A**
   - Conversion: 75% (< 80%) ⚠️
   - ABS: 1.5 (< 1.8) 🔴
   - ABV: ₹4200 (< ₹4500) 🔴
   - **Criteria Failed: Multiple**
   - Why: Conversion below 80%, ABS below 1.8, and ABV below ₹4500
   - Action: Focus on upselling, increase items per transaction, improve average transaction value

2. **Store C**
   - Conversion: 78% (< 80%) ⚠️
   - ABS: 1.9 ✅
   - ABV: ₹3800 (< ₹4500) 🔴
   - **Criteria Failed: Conversion + ABV**
   - Why: Low conversion rate and low average bill value
   - Action: Improve sales conversion techniques and promote higher-value items

3. **Store D**
   - Conversion: 82% ✅
   - ABS: 1.6 (< 1.8) 🔴
   - ABV: ₹4800 ✅
   - **Criteria Failed: ABS**
   - Why: Low average bill size (less than 1.8 items per transaction)
   - Action: Train staff on cross-selling and bundle promotions

**Store B** is NOT shown (all metrics pass criteria).

---

## 🚀 How to Test

### 1. **Backend API Test**

```bash
# Make sure backend is running
cd backend
npm start
```

### 2. **Trigger DSR Analysis**

Go to your frontend:
1. Navigate to **"DSR Analysis"** page
2. Click **"Analyze DSR Sheet"** button
3. Wait for AI analysis to complete

### 3. **Verify Results**

You should now see:

✅ **More stores flagged** as bad performing (stricter criteria)
✅ **New ABS column** showing Average Bill Size
✅ **New ABV column** showing Average Bill Value in ₹
✅ **New Issue column** showing which criteria failed (Conversion/ABS/ABV/Multiple)
✅ **Color-coded badges**:
   - Red for values below thresholds
   - Gray for values meeting thresholds
✅ **Updated "Root Cause"** explaining which specific criteria failed
✅ **CSV export** includes all new columns

### 4. **Expected Terminal Output**

```
🔗 Analyzing Suitor Guy Kerala DSR Sheet...
📊 Found 150 rows in the sheet
📅 Found DSR sheet date: 21/8/2025
📊 Processed 21 store data rows from 150 total rows
📨 Sending DSR analysis request to Groq using llama-3.3-70b-versatile...
🔍 Raw AI Response (DSR Analysis): {
  "analysisSummary": {
    "totalStores": "21",
    "badPerformingStores": "8",
    "keyFindings": "8 stores failing to meet performance criteria (Conversion < 80%, ABS < 1.8, or ABV < ₹4500)"
  },
  "badPerformingStores": [
    {
      "storeName": "Trissur",
      "conversionRate": "75%",
      "absValue": "1.5",
      "abvValue": "4200",
      "criteriaFailed": "Multiple",
      "whyBadPerforming": "Conversion rate below 80%, ABS below 1.8, and ABV below ₹4500",
      ...
    },
    ...
  ]
}
✅ Successfully parsed DSR analysis
```

---

## 📝 Files Changed

### Backend:
1. ✅ `backend/config/dsrPrompts.js`
   - Updated criteria thresholds
   - Added ABS and ABV requirements
   - Updated JSON output format
   - Enhanced instructions

### Frontend:
2. ✅ `frontend/src/components/DSRAnalysisDashboard.jsx`
   - Added ABS, ABV, and criteriaFailed fields to data mapping
   - Updated CSV export to include new columns
   - Added 3 new table columns (ABS, ABV, Issue)
   - Updated badge color coding
   - Changed conversion threshold from 70% to 80%

### Documentation:
3. ✅ `DSR_CRITERIA_UPDATE_SUMMARY.md` (this file)

---

## 🎯 Summary

**What Changed:**
- ✅ DSR analysis now flags stores with **Conversion < 80%** (was 70%)
- ✅ DSR analysis now flags stores with **ABS < 1.8** (new)
- ✅ DSR analysis now flags stores with **ABV < ₹4500** (new)
- ✅ **Any store meeting ANY criteria** = Bad Performing Store
- ✅ Frontend displays all 3 new metrics with color-coded badges
- ✅ AI explains which specific criteria failed
- ✅ CSV export includes all new columns

**Impact:**
- 📈 **More stores will be flagged** as bad performing (stricter criteria)
- 🎯 **Better insights** into specific problem areas (Conversion vs. ABS vs. ABV)
- 📊 **More detailed analysis** showing exactly what's wrong with each store
- 🚀 **Actionable recommendations** targeting the specific failing metrics

---

## ✅ You're All Set!

**Test the new DSR analysis now and you'll see:**
1. Stricter identification of underperforming stores
2. Clear visibility into ABS and ABV metrics
3. Specific identification of which criteria failed
4. Color-coded visual indicators for quick assessment
5. More targeted action plans based on specific metrics

**The DSR analysis will now catch stores that are underperforming in Conversion Rate, Average Bill Size, or Average Bill Value - giving you complete visibility into store performance!** 🎉

