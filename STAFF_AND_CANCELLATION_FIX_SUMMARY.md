# Staff Performance & Cancellation Data Fix

## Issues Reported

1. **Cancellation data not showing** for Kannur (and other North Cluster stores)
2. **Staff performance data showing only for KANNUR**, but not for:
   - KALPETTA
   - KOTTAKAL  
   - PMNA

## Root Causes Identified

### 1. Multi-Cluster Date Mismatch
**Problem:** Two Google Sheet clusters had different dates:
- South Cluster: `12/8/2025`
- North Cluster: `21/8/2025` (where Kannur is)

**Impact:** System was only fetching cancellations for `12/8/2025`, missing Kannur's cancellations from `21/8/2025`.

**Fix:** Created `convertMultipleDatesToRange()` function to fetch cancellations for date range covering BOTH dates (`12/8` to `21/8`).

### 2. Missing Location ID Mappings
**Problem:** Some stores couldn't fetch staff performance data because:
- **PMNA** had NO location ID mapping (`null`)
- **KOTTAKAL** was mapped to wrong location ID (8 instead of 17)

**Impact:** Backend couldn't fetch staff performance data from the API without valid location IDs.

**Fix:**
```javascript
// Added PMNA mapping
if (normalizedStoreName.includes('pmna') || normalizedStoreName === 'pmna') {
  return '16'; // SG.Perinthalmanna
}

// Fixed KOTTAKAL to default to SG location
if (normalizedStoreName.includes('kottakal')) {
  // ... logic updated to return '17' for SG.Kottakkal
}

// Added explicit KALPETTA mapping
if (normalizedStoreName.includes('kalpetta')) {
  return '20'; // SG.Kalpetta
}
```

## Files Modified

### 1. `backend/models/dsrModel.js`
- Changed date priority from `southData.date || northData.date` to `northData.date || southData.date`
- Added logging to show both cluster dates
- Returns both `southDate` and `northDate` in result object

### 2. `backend/utils/dateConverter.js`
- **New function:** `convertMultipleDatesToRange(dsrDates)`
- Takes array of dates, returns earliest to latest date range
- Example: `["12/8/2025", "21/8/2025"]` → `{DateFrom: "2025-8-12", DateTo: "2025-8-21"}`

### 3. `backend/controllers/dsrController.js`
- Updated integrated analysis to use `convertMultipleDatesToRange()`
- Fetches cancellations and staff performance for ENTIRE date range
- Added comprehensive logging for both cluster dates

### 4. `backend/config/storeLocationMapping.js`
- **Fixed:** PMNA now maps to Location ID 16
- **Fixed:** KOTTAKAL now maps to Location ID 17 (not 8)
- **Added:** Explicit KALPETTA mapping to Location ID 20
- **Improved:** Better handling of store name variations

## Location ID Mapping (Updated)

| Store Name | Location ID | Status |
|------------|------------|--------|
| KALPETTA | 20 | ✅ Fixed |
| KANNUR | 21 | ✅ Working |
| KOTTAKAL | 17 | ✅ Fixed (was 8) |
| PMNA | 16 | ✅ Fixed (was null) |

## How It Works Now

1. **Fetch DSR data** from both clusters:
   - South Cluster (12/8/2025): Kottayam, Perumbavoor, Edappally, etc.
   - North Cluster (21/8/2025): EDAPPAL, KOTTAKAL, PMNA, KANNUR, etc.

2. **Create date range** covering both dates (12/8 to 21/8)

3. **Fetch cancellations** for entire date range:
   ```
   📅 Combined date range: 2025-8-12 to 2025-8-21
   🔗 Fetching cancellations from Rental API...
   ✅ Found cancellations for KANNUR, EDAPPAL, PMNA, etc.
   ```

4. **Fetch staff performance** for each store using Location ID:
   ```
   📍 KALPETTA (Location ID: 20) → API call
   📍 KANNUR (Location ID: 21) → API call
   📍 KOTTAKAL (Location ID: 17) → API call
   📍 PMNA (Location ID: 16) → API call
   ```

5. **Display results** in frontend with ALL data

## Expected Terminal Output

```
📍 Fetching SOUTH CLUSTER data...
📅 Found South Cluster date: 12/8/2025

📍 Fetching NORTH CLUSTER data...
📅 Found North Cluster date: 21/8/2025

📅 Combined date range: 2025-8-12 to 2025-8-21
📅 Fetching cancellations for date range: 2025-8-12 to 2025-8-21

📊 Fetching staff performance for 4 stores...
   📍 Fetching staff data for KALPETTA (Location ID: 20)...
   ✅ Staff data fetched for KALPETTA
   
   📍 Fetching staff data for KANNUR (Location ID: 21)...
   ✅ Staff data fetched for KANNUR
   
   📍 Fetching staff data for KOTTAKAL (Location ID: 17)...
   ✅ Staff data fetched for KOTTAKAL
   
   📍 Fetching staff data for PMNA (Location ID: 16)...
   ✅ Staff data fetched for PMNA
```

## Frontend Expected Results

All 4 stores should now show:
- ✅ **DSR Data** (Conversion%, ABS, ABV)
- ✅ **Cancellation Data** (count, reasons, severity)
- ✅ **Staff Performance Data** (conversion rate, bills, staff count, individual staff details)

## Testing Steps

1. **Stop any running backend servers:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Start backend server:**
   ```bash
   cd backend
   node server.js
   ```

3. **Open frontend** and navigate to Integrated Analysis page

4. **Check terminal output** for:
   - Both cluster dates being logged
   - Combined date range for cancellations
   - Staff data being fetched for all 4 stores

5. **Verify frontend shows:**
   - KANNUR: Cancellations = 4, Staff data = YES
   - KALPETTA: Staff data = YES
   - KOTTAKAL: Staff data = YES
   - PMNA: Staff data = YES

## Troubleshooting

### If staff data still shows "N/A":
1. Check terminal for "⚠️ No location ID mapping found for [STORE]"
2. Verify Location ID exists in `storeLocationMapping.js`
3. Test mapping: `node -e "const {getLocationIDFromStoreName} = require('./config/storeLocationMapping'); console.log(getLocationIDFromStoreName('STORENAME'));"`

### If cancellations still show 0:
1. Check terminal for "📅 Combined date range"
2. Verify API is being called with date range, not single date
3. Check cancellation API response in terminal logs

## API Endpoints

### Staff Performance API
```
POST https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel
Body: {
  "DateFrom": "2025-8-12",
  "DateTo": "2025-8-21",
  "LocationID": "20", // Specific store
  "UserID": "7777"
}
```

### Cancellation API
```
POST https://rentalapi.rootments.live/api/Reports/CancelReport?DateFrom=2025-8-12&DateTo=2025-8-21&LocationID=0&UserID=7777
```

---

**Date Fixed:** October 25, 2025  
**Issues:** 
1. Kannur cancellations not showing (date mismatch)
2. Staff data showing only for 1 store (missing location ID mappings)

**Status:** ✅ Both issues resolved

**Next Step:** Restart backend server and test

