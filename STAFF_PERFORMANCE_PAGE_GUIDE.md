# Staff Performance Page - User Guide

## 🎉 **New Dedicated Staff Performance Page Created!**

I've created a separate page just for viewing staff performance data by store location. This will help you verify if the API is working and see all staff metrics clearly.

---

## 🚀 **How to Access:**

### Step 1: Start Your Servers

**Backend:**
```bash
cd backend
node server.js
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Step 2: Open Your Browser

Navigate to: `http://localhost:5173`

### Step 3: Click on "Staff Performance" Tab

You'll see a new tab in the navigation:
```
DSR Analysis | Cancellation Data | Staff Performance | Action Plan
                                      ↑
                                  Click Here!
```

---

## 📊 **What You'll See:**

### Filters Section:
- **Date From**: Enter start date (Format: YYYY-M-D, e.g., `2025-8-21`)
- **Date To**: Enter end date (Format: YYYY-M-D, e.g., `2025-8-21`)
- **Location ID**: Choose specific store or "All Stores (0)"
- **Fetch Data Button**: Click to load staff performance data

### Location ID Options:
```
0  = All Stores
1  = Z Edapally
3  = SG Edapally
5  = Trivandrum
7  = Z Perinthalmanna
8  = Z Kottakkal
9  = Z Kottayam
10 = SG Perumbavoor
11 = SG Thrissur
12 = SG Chavakkad
13 = SG Calicut
14 = SG Vadakara
15 = SG Edapally
16 = SG Perinthalmanna
17 = SG Kottakkal
18 = SG Manjeri
19 = SG Palakkad
20 = SG Kalpetta
21 = SG Kannur
```

---

## 🎯 **How to Use:**

### Test 1: Fetch All Stores
1. Keep default settings:
   - Date From: `2025-8-21`
   - Date To: `2025-8-21`
   - Location ID: `0` (All Stores)
2. Click **"Fetch Data"**
3. Wait for results (10-30 seconds)

**Expected Result:**
- Summary cards showing total stores, conversion rates
- Table with all stores sorted by performance
- Individual staff details for each store

### Test 2: Fetch Specific Store
1. Change Location ID to `11` (SG Thrissur)
2. Click **"Fetch Data"**
3. See only SG Thrissur staff performance

### Test 3: Different Date
1. Change Date From: `2025-8-20`
2. Change Date To: `2025-8-20`
3. Click **"Fetch Data"**
4. See if data exists for that date

---

## 📋 **Data Displayed:**

### Summary Cards (Top):
```
┌─────────────┬──────────────────┬────────────────┬──────────────┐
│ Total       │ Needs Attention  │ Avg Conversion │ Total        │
│ Stores      │ (CRITICAL/POOR)  │ Rate           │ Walk-ins     │
└─────────────┴──────────────────┴────────────────┴──────────────┘
```

### Store Performance Table:
```
┌───┬───────────────┬─────────────┬────────────┬──────────┬───────┬─────────┐
│ # │ Store Name    │ Performance │ Conv. Rate │ Walk-ins │ Bills │ Staff   │
├───┼───────────────┼─────────────┼────────────┼──────────┼───────┼─────────┤
│ 1 │ SG Thrissur   │ CRITICAL    │ 42%        │ 120      │ 50    │ 4 staff │
│ 2 │ SG Edapally   │ GOOD        │ 75%        │ 180      │ 135   │ 6 staff │
│ 3 │ Z Kottakkal   │ AVERAGE     │ 68%        │ 95       │ 65    │ 3 staff │
└───┴───────────────┴─────────────┴────────────┴──────────┴───────┴─────────┘
```

### Individual Staff Details:
Shows each staff member's:
- Name
- Walk-ins handled
- Bills converted
- Conversion rate
- Loss of sale

---

## 🔍 **Performance Status Colors:**

- 🔴 **CRITICAL** (< 50%) - Red badge - Urgent action needed
- 🟠 **POOR** (50-70%) - Yellow badge - Training recommended
- 🟡 **AVERAGE** (70-85%) - Blue badge - Monitor closely
- 🟢 **GOOD** (> 85%) - Green badge - Performing well

---

## ❌ **Troubleshooting:**

### Error: "Failed to fetch staff performance data"

**Check:**
1. Is backend running? (`node server.js` in backend folder)
2. Check terminal for error messages
3. Is the API accessible? Test: `http://localhost:5000/api/test-staff-performance`

### No Data Returned

**Possible Reasons:**
1. No staff performance data exists for that date
2. Try a different date that you know has data
3. LocationID might be incorrect
4. API might be down or slow

**Solution:**
- Check terminal logs for detailed error
- Try LocationID "0" for all stores
- Try date: `2025-8-21` or a recent date with known data

### "No staff performance data available"

**This means:**
- The API returned empty data
- The date you selected has no records
- Try a different date or location

---

## 🧪 **Testing Checklist:**

- [ ] Backend server is running
- [ ] Frontend is accessible at http://localhost:5173
- [ ] Can see "Staff Performance" tab in navigation
- [ ] Can click "Fetch Data" button
- [ ] Gets response (success or error)
- [ ] Check terminal logs for API call details
- [ ] If error, error message is displayed clearly

---

## 📊 **What This Tells You:**

### If Data Loads Successfully:
✅ **Staff Performance API is working!**
✅ The date has data available
✅ Store names and metrics are correct
✅ You can now use this data in Integrated Analysis

### If Data Fails to Load:
❌ Check the error message
❌ Look at terminal logs for exact error
❌ Verify API endpoint is accessible
❌ Check if date format is correct (YYYY-M-D)

---

## 🎯 **Next Steps:**

### Once Staff Performance Loads Successfully Here:

1. **Go to "Action Plan" tab** (Integrated Analysis)
2. **Click "Run Analysis"**
3. **Check terminal** - You should now see:
   ```
   📊 Step 3: Fetching staff performance data...
   ✅ Staff performance data available for 18 stores
   ✓ STAFF PERFORMANCE MATCH: "SG Thrissur" → "SG.Thrissur"
   ```
4. **In the table**, staff performance should show instead of "N/A"

### If It Works Here But Not in Integrated Analysis:

**Reason**: Store name mismatch between DSR and Staff Performance API

**Fix**: Check terminal logs to see which stores are matching:
```
✓ STAFF PERFORMANCE MATCH: "Palakkad" → "SG.Palakkad"  ← Good!
✗ No match found for store: "Some Store Name"          ← Bad!
```

Update `backend/config/storeLocationMapping.js` to add missing store name variations.

---

## 💡 **Pro Tips:**

1. **Test with All Stores first** (LocationID = 0) to see overall data
2. **Use recent dates** (last week or month) for accurate data
3. **Watch terminal logs** - they show exactly what's happening
4. **Compare dates** - Use same date as your DSR for accurate comparison
5. **Check staff issues** - Red text shows specific staff problems

---

## 📞 **Still Having Issues?**

### Check Terminal Logs:
```bash
# In backend terminal, you should see:
================================================================================
🔗 FETCHING STAFF PERFORMANCE DATA FROM RENTAL API
================================================================================
📊 Staff Performance Query Parameters:
   DateFrom: 2025-8-21
   DateTo: 2025-8-21
   LocationID: 0
   UserID: 7777
✅ Staff performance data fetched successfully
📊 Total staff performance records received: 45
```

### Common Issues:

**Issue 1**: `ETIMEDOUT`
- API server is slow or unreachable
- Check internet connection
- Try again after a few minutes

**Issue 2**: Status 404 or 500
- API endpoint might have changed
- Verify URL: `https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel`

**Issue 3**: Empty data
- No records exist for that date
- Try different dates
- Verify LocationID is correct

---

## ✅ **Success Indicators:**

You'll know everything is working when you see:

1. ✅ Summary cards with numbers (not zeros)
2. ✅ Table with multiple stores listed
3. ✅ Performance badges (CRITICAL, POOR, AVERAGE, GOOD)
4. ✅ Conversion rates with colors
5. ✅ Individual staff details section
6. ✅ No error messages

---

**This dedicated page helps you verify the Staff Performance API is working independently before trying the integrated analysis!** 🎉

**If this page loads data successfully, then the API is working - we just need to ensure store name matching in the integrated analysis.** 🎯

