# Display Only Top 4 Worst Performing Stores

## Change Summary

Updated the Action Plan page to show **ONLY the 4 worst performing stores** instead of all 17 stores, to save AI tokens and focus on stores that need urgent attention.

## What Was Changed

### Frontend (IntegratedAnalysisSimple.jsx)

#### 1. **Store List Filtering**
- **Before:** Displayed all 17 stores
- **After:** Displays only top 4 worst stores
- Filter: `store => !store.usedFallbackPlan` (stores with AI-powered plans)
- Additional safety: `.slice(0, 4)` to ensure maximum 4 stores

#### 2. **Summary Statistics**
- **Before:** Calculated stats for all 17 stores
- **After:** Calculates stats only for top 4 stores
- All metrics (Critical, Attention, Bills, Cancellations, Loss of Sale) now show top 4 totals

#### 3. **Visual Improvements**
- Added yellow info banner explaining only top 4 are shown
- Updated card labels to show "(Top 4)" 
- Added conversion rate ranges for clarity
- Changed header from "Store Performance (17 stores)" to "Top 4 Worst Performing Stores"

## Selection Criteria

The 4 worst stores are automatically selected based on **"badness score"** calculated from:
- **Conversion Rate** (weight: 70%) - below 80%
- **ABS (Average Bill Size)** (weight: 15%) - below 1.8
- **ABV (Average Bill Value)** (weight: 15%) - below 4500

Formula:
```javascript
convBadness = max(0, 80 - conversionRate)
absBadness = max(0, (1.8 - abs) * 50)
abvBadness = max(0, (4500 - abv) / 100)

Total Score = (convBadness × 0.7) + (absBadness × 0.15) + (abvBadness × 0.15)
```

**Higher score = Worse performance = Higher priority**

## Example Based on Current Data

From your latest run, the top 4 worst stores are:

1. **Kottayam** (Score: 41.79)
   - Conv: 30.90%, ABS: 1.01, ABV: 3506
   - ✅ Has 2 lost customers with loss of sale data

2. **KANNUR** (Score: 28.42)
   - Conv: 46.76%, ABS: 1.26, ABV: 3768
   - ✅ Has 3 lost customers with loss of sale data

3. **KOTTAKAL** (Score: 27.95)
   - Conv: 47.27%, ABS: 1.27, ABV: 3792
   - ✅ Has loss of sale data

4. **PMNA** (Perinthalmanna) (Score: 25.43)
   - Conv: 50.33%, ABS: 1.31, ABV: 3843
   - ✅ Has 2 lost customers with loss of sale data

## What You'll See

### Summary Cards (Top Section)
- **Critical (Top 4)** - Conv < 50%
- **Needs Attention (Top 4)** - Conv 50-70%
- **Above Average (Top 4)** - Conv ≥ 70%
- **Cancellations** - Top 4 stores
- **Total Bills** - Top 4 stores
- **Loss of Sale** - Top 4 stores

### Info Banner
> 📌 **Note:** Showing only the **4 worst performing stores** that need immediate action (ABS < 1.8, ABV < 4500, Conversion < 80%). These stores receive AI-powered action plans with detailed loss of sale analysis.

### Store Cards
Only 4 store cards will be displayed, each with:
- ✅ AI-powered action plans (not fallback plans)
- ✅ Complete loss of sale analysis
- ✅ Staff performance details
- ✅ Attendance issues (if any)
- ✅ What customers wanted
- ✅ Product unavailability issues
- ✅ Detailed root cause analysis
- ✅ Immediate, short-term, and long-term action plans

## Benefits

1. **Token Savings** ⚡
   - Only 4 stores get AI-powered plans
   - Remaining 13 get simple rule-based plans (backend only)
   - Saves significant AI API costs

2. **Focused Attention** 🎯
   - Shows only stores that need URGENT action
   - Clear priorities for management
   - No information overload

3. **Better Performance** 🚀
   - Faster page load
   - Less data to process
   - Cleaner UI

4. **Complete Data** 📊
   - Loss of sale data with reasons
   - What customers wanted
   - Product gaps
   - Staff issues
   - All for the 4 worst stores

## Backend Processing

The backend still processes all 17 stores but with different approaches:

- **Top 4 Worst** → AI-powered action plans (Groq API)
- **Remaining 13** → Rule-based fallback plans (no AI tokens used)

The backend response includes all 17 stores, but frontend filters to show only top 4.

## Testing

1. Go to Action Plan page
2. Click "📊 Analyze All Stores"
3. You should see:
   - Summary cards showing "Top 4" labels
   - Yellow info banner
   - Exactly 4 store cards (worst performers)
   - Complete loss of sale data for each
   - Kottayam, KANNUR, KOTTAKAL, PMNA (based on current data)

## Files Modified

- ✅ `frontend/src/components/IntegratedAnalysisSimple.jsx`
  - Line 30-65: Updated getSummary() to filter top 4
  - Line 228-304: Updated summary cards with "(Top 4)" labels
  - Line 346-365: Added filter and info banner for store list

---
**Date:** October 30, 2025  
**Purpose:** Show only 4 worst performing stores to save AI tokens  
**Status:** ✅ **IMPLEMENTED**

