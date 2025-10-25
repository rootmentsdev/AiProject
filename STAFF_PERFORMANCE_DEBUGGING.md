# Staff Performance Data - Debugging Guide

## Issue: Staff Performance showing "N/A"

If you're seeing "No staff performance data available" or "N/A" in the frontend, follow these debugging steps:

---

## Step 1: Test the Staff Performance API Directly

### Option A: Using the Test Endpoint

1. Start your backend server:
```bash
cd backend
node server.js
```

2. Open your browser and navigate to:
```
http://localhost:5000/api/test-staff-performance
```

3. Check the terminal logs for detailed information about the API call

### Option B: Using cURL or Postman

Test the Rootments API directly:

```bash
curl -X POST "https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel?DateFrom=2025-8-21&DateTo=2025-8-21&LocationID=0&UserID=7777"
```

**Expected Response**: JSON data with staff performance metrics

**If you get an error**:
- Check if the API URL is correct
- Verify the date format (YYYY-M-D)
- Confirm UserID and LocationID are valid
- Check if you need authentication

---

## Step 2: Check the Terminal Logs

When you run "Integrated Analysis", look for these logs in your terminal:

### ✅ **Good Logs** (Staff Performance Working):
```
================================================================================
🔗 FETCHING STAFF PERFORMANCE DATA FROM RENTAL API
================================================================================
📊 Staff Performance Query Parameters:
   DateFrom: 2025-8-21
   DateTo: 2025-8-21
   LocationID: 0
   UserID: 7777
🌐 API URL: https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel
✅ Staff performance data fetched successfully
📊 Response status: 200
📊 Total staff performance records received: 45
📊 Staff performance data available for 18 stores

👥 STORE-WISE STAFF PERFORMANCE (DSR Date):
════════════════════════════════════════════════

1. 🔴 SG Thrissur
   Status: CRITICAL
   Conversion Rate: 41.67%
   ...
```

### ❌ **Bad Logs** (Staff Performance Failing):
```
================================================================================
❌ FAILED TO FETCH STAFF PERFORMANCE DATA
================================================================================
❌ Error message: connect ETIMEDOUT
❌ Error code: ETIMEDOUT
```

---

## Step 3: Common Issues and Solutions

### Issue 1: API Timeout
**Symptoms**: Error code `ETIMEDOUT` or `ECONNABORTED`

**Solutions**:
1. Check your internet connection
2. Try increasing timeout in `staffPerformanceService.js`:
```javascript
timeout: 60000 // Increase from 30000 to 60000
```

3. Verify the API URL is accessible:
```bash
ping rentalapi.rootments.live
```

### Issue 2: Wrong Date Format
**Symptoms**: API returns empty data or error

**Solutions**:
1. Check date format - should be `YYYY-M-D` not `YYYY-MM-DD`
   - ✅ Correct: `2025-8-21`
   - ❌ Wrong: `2025-08-21`

2. Verify the DSR sheet date is being converted correctly:
```javascript
// Look for this log:
📅 Using DSR sheet date for staff performance data: 12/8/2025
```

### Issue 3: API Authentication Required
**Symptoms**: Status 401 or 403

**Solutions**:
1. Check if API requires authentication headers
2. Add API key if needed in `staffPerformanceService.js`

### Issue 4: No Data for Date
**Symptoms**: API succeeds but returns empty array

**Solutions**:
1. Verify data exists for that date in the API
2. Try a different date that you know has data
3. Check if LocationID "0" returns all stores or needs specific IDs

### Issue 5: Store Name Mismatch
**Symptoms**: API returns data but stores show "N/A"

**Solutions**:
1. Check store name matching in logs:
```
✓ STAFF PERFORMANCE MATCH: "SG Thrissur" → "SG.Thrissur"
```

2. If no matches, update `backend/config/storeLocationMapping.js` with correct names

3. Add fuzzy matching variations

---

## Step 4: Manual Testing

### Test 1: Direct API Call

Create a test file `test-staff-api.js`:

```javascript
const axios = require('axios');

async function testAPI() {
  try {
    const url = 'https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel';
    const params = new URLSearchParams({
      DateFrom: '2025-8-21',
      DateTo: '2025-8-21',
      LocationID: '0',
      UserID: '7777'
    });
    
    const response = await axios.post(`${url}?${params}`, {}, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Data type:', typeof response.data);
    
    if (response.data.dataSet && response.data.dataSet.data) {
      console.log('Records:', response.data.dataSet.data.length);
      console.log('Sample record:', response.data.dataSet.data[0]);
    } else if (Array.isArray(response.data)) {
      console.log('Records:', response.data.length);
      console.log('Sample record:', response.data[0]);
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
```

Run it:
```bash
node test-staff-api.js
```

### Test 2: Check Store Name Matching

Add this to see which stores are being matched:

```javascript
// In dsrController.js, add logging:
console.log('\n📋 DSR Store Names:', dsrStores.map(s => s.storeName));
console.log('📋 Staff Performance Store Names:', Object.keys(staffPerformanceStores));
```

---

## Step 5: Verify Data Structure

Expected staff performance data structure:

```javascript
{
  success: true,
  analysis: {
    storeWisePerformance: {
      "SG Thrissur": {
        storeName: "SG Thrissur",
        walkIns: 120,
        bills: 50,
        conversionRate: "41.67",
        performanceStatus: "CRITICAL",
        staffCount: 4,
        staffDetails: [...]
      },
      "SG Edapally": { ... }
    }
  }
}
```

If your API returns different structure, update `staffPerformanceService.js` to match.

---

## Step 6: Enable Debug Mode

Add this to `backend/server.js` for more logging:

```javascript
// Add after GROQ_API_KEY check
process.env.DEBUG_MODE = 'true';
```

Then in `staffPerformanceService.js`:

```javascript
if (process.env.DEBUG_MODE === 'true') {
  console.log('🐛 DEBUG: Full API response:', JSON.stringify(responseData, null, 2));
}
```

---

## Quick Checklist

- [ ] Backend server is running (`node server.js`)
- [ ] Test endpoint works (`http://localhost:5000/api/test-staff-performance`)
- [ ] API URL is accessible from your machine
- [ ] Date format is correct (YYYY-M-D)
- [ ] UserID and LocationID are valid
- [ ] Store names match between DSR and API
- [ ] No firewall blocking the API
- [ ] Timeout is sufficient (30+ seconds)

---

## Expected Terminal Output

When everything works, you should see:

```
📊 Step 3: Fetching staff performance data...
================================================================================
🔗 FETCHING STAFF PERFORMANCE DATA FROM RENTAL API
================================================================================
📊 Staff Performance Query Parameters:
   DateFrom: 2025-8-21
   DateTo: 2025-8-21
   ...
✅ Staff performance data fetched successfully
📊 Staff performance data available for 18 stores

✓ STAFF PERFORMANCE MATCH: "SG Thrissur" → "SG.Thrissur"
✓ STAFF PERFORMANCE MATCH: "SG Edapally" → "SG.Edapally"
...

🚨 CRITICAL STORE ANALYSIS: SG Thrissur
   DSR Loss: ₹25,000
   Cancellations: 2
   Staff Performance: 42% (CRITICAL)  ← THIS SHOULD APPEAR!
```

---

## Still Not Working?

1. **Check the API documentation**: Verify the endpoint URL and parameters
2. **Try a different date**: Some dates might not have data
3. **Test with specific LocationID**: Instead of "0", try "11" (SG Thrissur)
4. **Check API response format**: It might have changed

---

## Contact

If staff performance is still not working after these steps, check:
1. Is the API endpoint correct?
2. Do you have access to the API?
3. Is the data available for the DSR date?
4. Are the store names exactly the same in both systems?

**The integration is complete - we just need to ensure the API is accessible and returns data!**


