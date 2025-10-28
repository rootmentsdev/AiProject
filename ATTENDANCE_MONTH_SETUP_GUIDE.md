# Attendance Monthly Tab Setup Guide

## 🎯 What We've Implemented

Your attendance system now:
1. ✅ **Automatically detects the month from DSR sheet** (e.g., if DSR date is "21/10/2025", it fetches October's attendance)
2. ✅ **Shows attendance only up to current date** (e.g., if today is Oct 20, shows days 1-20 only)
3. ✅ **Fetches from the correct monthly tab** in your Google Sheet

## 📋 Important: You Need to Configure Month GIDs

Your Google Sheet has tabs for each month (JANUARY2025, FEBRUARY2025, etc.). Each tab has a unique **GID** (sheet ID).

### How to Get GIDs for Each Month

1. **Open your attendance Google Sheet**: https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit

2. **Click on each month tab** at the bottom of the sheet

3. **Look at the URL** - it will change to something like:
   ```
   https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit#gid=123456789
   ```

4. **Copy the number after `gid=`** - that's the GID for that month

5. **Repeat for all 12 months**

### Example:
- When you click "JANUARY2025" tab, URL shows: `#gid=123456`  → GID is `123456`
- When you click "FEBRUARY2025" tab, URL shows: `#gid=789012` → GID is `789012`
- When you click "OCTOBER" tab, URL shows: `#gid=848974343` → GID is `848974343` (we already have this one!)

## 🔧 Update the GIDs in Backend

Once you have all the GIDs, update this file: **`backend/models/attendanceModel.js`**

Find this section (around line 8-22):

```javascript
this.MONTH_GIDS = {
  'JANUARY': '0',        // ⚠️ REPLACE WITH ACTUAL GID
  'FEBRUARY': '1',       // ⚠️ REPLACE WITH ACTUAL GID
  'MARCH': '2',          // ⚠️ REPLACE WITH ACTUAL GID
  'APRIL': '3',          // ⚠️ REPLACE WITH ACTUAL GID
  'MAY': '4',            // ⚠️ REPLACE WITH ACTUAL GID
  'JUNE': '5',           // ⚠️ REPLACE WITH ACTUAL GID
  'JULY': '6',           // ⚠️ REPLACE WITH ACTUAL GID
  'AUGUST': '7',         // ⚠️ REPLACE WITH ACTUAL GID
  'SEPTEMBER': '8',      // ⚠️ REPLACE WITH ACTUAL GID
  'OCTOBER': '848974343', // ✅ Already correct!
  'NOVEMBER': '10',      // ⚠️ REPLACE WITH ACTUAL GID
  'DECEMBER': '11'       // ⚠️ REPLACE WITH ACTUAL GID
};
```

**Replace the placeholder numbers with actual GIDs:**

```javascript
this.MONTH_GIDS = {
  'JANUARY': '123456789',    // Your actual GID for JANUARY2025 tab
  'FEBRUARY': '987654321',   // Your actual GID for FEBRUARY2025 tab
  'MARCH': '111222333',      // Your actual GID for MARCH 2025 tab
  'APRIL': '444555666',      // Your actual GID for APRIL2025 tab
  'MAY': '777888999',        // Your actual GID for MAY 2025 tab
  'JUNE': '111000222',       // Your actual GID for JUNE 2025 tab
  'JULY': '333444555',       // Your actual GID for JULY 2025 tab
  'AUGUST': '666777888',     // Your actual GID for AUGUST 2025 tab
  'SEPTEMBER': '999000111',  // Your actual GID for SEPTEMBER tab
  'OCTOBER': '848974343',    // ✅ Already have this!
  'NOVEMBER': '222333444',   // Your actual GID for NOVEMBER tab
  'DECEMBER': '555666777'    // Your actual GID for DECEMBER tab
};
```

## ⚠️ CRITICAL: Make Sheet Public

Don't forget to make your attendance Google Sheet publicly accessible:

1. Open: https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit
2. Click "Share" (top-right)
3. Click "Restricted" under "General access"
4. Select "Anyone with the link"
5. Set to "Viewer"
6. Click "Done"

## 🧪 Test It

1. **Restart your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Open the test URL:**
   ```
   http://localhost:5000/api/attendance/test-access
   ```
   
   You should see:
   ```json
   {
     "status": 200,
     "accessible": true,
     "message": "✅ Sheet is accessible!"
   }
   ```

3. **Open your app and go to Attendance tab:**
   ```
   http://localhost:5173
   ```
   
   Click "Attendance" tab - you should see:
   - ✅ Correct month displayed (e.g., "OCTOBER 2025 (Days 1-20)")
   - ✅ Only days up to current date shown
   - ✅ Summary cards with accurate counts
   - ✅ Employee table with filtered day columns

## 📊 How It Works

1. **System checks DSR sheet date** (e.g., "21/10/2025")
2. **Extracts month** → "OCTOBER"
3. **Looks up GID** → "848974343"
4. **Fetches that specific tab** from Google Sheets
5. **Filters columns** to show only days 1-21 (up to DSR date)
6. **Calculates summaries** based on visible days only

## 🎨 Summary Cards Explained

- **Total Employees** - Number of employees in the sheet
- **Days Tracked** - How many days shown (e.g., 20 if showing Oct 1-20)
- **Total Present Days** - Sum of all 'P' markings across all employees
- **Total Absent Days** - Sum of all 'A' markings
- **Total Leave Days** - Sum of all 'L' and 'AL' markings
- **Weekly Off Days** - Sum of all 'w/o' markings
- **LOP Days** - Sum of all 'LOP' (Loss of Pay) markings
- **Attendance Rate** - (Present Days / Total Working Days) × 100%

## 🔄 Attendance Codes Recognized

The system recognizes these attendance codes:
- **P** - Present (counted as present)
- **A** - Absent (counted as absent)
- **L, AL** - Leave, Annual Leave (counted as leave)
- **w/o** - Weekly Off (not counted in working days)
- **LOP** - Loss of Pay (counted as absent)
- **H/D** - Half Day (counted as present)
- **M** - Morning (counted as present)
- **CKD** - Checked (counted as present)

## 📝 Quick Reference

| What You Want | What To Do |
|---------------|------------|
| Change which month is shown | System auto-detects from DSR sheet |
| Show more/fewer days | System auto-limits to current date from DSR |
| Add a new month tab | Get the GID and add to `MONTH_GIDS` |
| Update attendance codes | Edit `calculateSummary()` in `attendanceModel.js` |

---

**Need help?** Check the backend console logs - they show exactly which month and day range is being fetched!

