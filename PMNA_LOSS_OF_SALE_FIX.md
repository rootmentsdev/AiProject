# PMNA Loss of Sale Display Fix

## Issue
**PMNA (Perinthalmanna)** loss of sale data was not showing in the frontend even though:
- PERINTHALMANNA had 2 lost customers in the data
- PMNA was in the top 4 worst performing stores
- Other stores' loss of sale data was displaying correctly

## Root Cause
The fuzzy matching algorithm in `dsrController.js` was only checking for **substring matches**, not **alias-based matches**.

**Example of the problem:**
- Store name in DSR: `PMNA`
- Store name in Loss of Sale sheet: `PERINTHALMANNA`
- Old fuzzy matching: `"PMNA".includes("PERINTHALMANNA")` → ❌ FALSE
- Result: No match found, no loss of sale data displayed

## Solution
Enhanced the fuzzy matching algorithm to use **alias-based matching** (same logic as `lossOfSaleModel.js`).

### Store Aliases Added
```javascript
const storeAliases = {
  'TRIVANDRUM': ['trivandrum', 'tvm', 'thiruvananthapuram', 'sg'],
  'MG ROAD': ['mgroad', 'mg', 'ernakulam'],
  'EDAPALLY': ['edapally', 'edappally', 'edapal'],
  'PERUMBAVOOR': ['perumbavoor', 'perumbavur', 'pmvr'],
  'KOTTAYAM': ['kottayam', 'ktm'],
  'THRISSUR': ['thrissur', 'trichur', 'tcr', 'trissur'],
  'PALAKKAD': ['palakkad', 'palghat', 'pkd'],
  'CHAVAKKAD': ['chavakkad', 'chavakad', 'chvkd'],
  'EDAPPAL': ['edappal', 'edapal'],
  'MANJERI': ['manjeri', 'manjery', 'mjr'],
  'PERINTHALMANNA': ['perinthalmanna', 'pmna', 'pma'], // ✅ KEY FIX
  'KOTTAKKAL': ['kottakkal', 'kottakal', 'ktk'],
  'CALICUT': ['calicut', 'kozhikode', 'clct', 'clt'],
  'VADAKARA': ['vadakara', 'vadakkara', 'vdk', 'vatakara'],
  'KALPETTA': ['kalpetta', 'kalpeta', 'klp'],
  'KANNUR': ['kannur', 'cannanore', 'knr']
};
```

### Matching Algorithm
1. **Direct Match** - Check exact store name
2. **Alias-Based Match** - Check if both names match to the same canonical store via aliases
3. **Substring Match** - Fallback to original substring logic

**Example with new matching:**
- Store name in DSR: `PMNA`
- Store name in Loss of Sale: `PERINTHALMANNA`
- Normalized input: `pmna`
- Normalized loss: `perinthalmanna`
- Check aliases for `PERINTHALMANNA`: `['perinthalmanna', 'pmna', 'pma']`
- `pmna` matches alias `pmna` ✅
- `perinthalmanna` matches alias `perinthalmanna` ✅
- **MATCH FOUND!** ✅

## Expected Results

### Before Fix
```
📊 Top 4 Worst Performing Stores:
1. Kottayam - ✅ Loss of Sale: 2 customers
2. KANNUR - ✅ Loss of Sale: 3 customers
3. KOTTAKAL - ✅ Loss of Sale: 0 customers
4. PMNA - ❌ Loss of Sale: NOT SHOWING (but data exists!)
```

### After Fix
```
📊 Top 4 Worst Performing Stores:
1. Kottayam - ✅ Loss of Sale: 2 customers
2. KANNUR - ✅ Loss of Sale: 3 customers
3. KOTTAKAL - ✅ Loss of Sale: 0 customers
4. PMNA - ✅ Loss of Sale: 2 customers (NOW SHOWING!)
```

### What You'll See in Frontend

#### PMNA (Perinthalmanna) Store Card
```
📉 LOSS OF SALE ANALYSIS - 2 Customers Lost

Why Customers Left:
• N/A: 2 cases

What Customers Wanted:
1. [Customer specific needs from 'Other Comments']
2. [Customer specific needs from 'Other Comments']

Impact Summary:
• 2 customers lost = X% of walk-ins
• These losses are PREVENTABLE!
```

## Other Stores That Will Benefit

This fix also improves matching for:
- **MANJERY** → MANJERI
- **VATAKARA** → VADAKARA  
- **KOTTAKAL** → KOTTAKKAL
- **TRISSUR** → THRISSUR

## Console Logs to Verify

When the backend processes PMNA, you'll see:
```
🔍 Fuzzy matched loss of sale (via alias): "PMNA" → "PERINTHALMANNA" (2 lost customers)
```

## Testing Instructions

1. **Restart Backend** (if not already running)
   ```bash
   cd backend
   npm start
   ```

2. **Go to Action Plan Page**
   - Navigate to Integrated Analysis
   - Click "Analyze All Stores"

3. **Check PMNA Store**
   - Look for PMNA in the top 4 stores
   - Expand the store card
   - Scroll down to find "📉 LOSS OF SALE ANALYSIS" section
   - Verify:
     - ✅ Shows "2 Customers Lost"
     - ✅ Shows "Why Customers Left" with reasons
     - ✅ Shows "What Customers Wanted" with specific needs
     - ✅ Shows "Impact Summary"

4. **Check Console Logs**
   - Look for: `🔍 Fuzzy matched loss of sale (via alias): "PMNA" → "PERINTHALMANNA"`

## Files Modified
- `backend/controllers/dsrController.js` (Lines 1322-1409)
  - Added store alias mappings
  - Enhanced fuzzy matching algorithm
  - Added 3-tier matching: direct → alias → substring

## Technical Details

### Matching Priority
1. **Direct Match** (highest priority)
   - Exact match: `"PMNA" === "PMNA"`
   
2. **Alias Match** (medium priority)
   - Both names resolve to same canonical store
   - Example: `PMNA` and `PERINTHALMANNA` both match `PERINTHALMANNA` aliases
   
3. **Substring Match** (lowest priority, fallback)
   - One name contains the other
   - Example: `"EDAPALLY"` contains `"EDAPAL"`

### Console Logging
Each match type logs differently for debugging:
- `🔍 Fuzzy matched loss of sale: "X" → "Y"` - Direct match
- `🔍 Fuzzy matched loss of sale (via alias): "X" → "Y"` - Alias match
- `🔍 Fuzzy matched loss of sale (substring): "X" → "Y"` - Substring match

## Benefits

✅ **PMNA loss of sale data now displays correctly**  
✅ **Consistent matching across all store name variations**  
✅ **Same alias logic as lossOfSaleModel.js**  
✅ **Better debugging with detailed console logs**  
✅ **More robust matching for future store name changes**  

## Success Criteria

✅ PMNA shows loss of sale section with 2 lost customers  
✅ All 4 top stores show their respective loss of sale data  
✅ Console logs show successful alias matching  
✅ Action plans include specific items addressing PMNA's 2 lost customers  

---

**Generated:** $(date)
**Status:** ✅ Ready for Testing (Restart Backend Required)

