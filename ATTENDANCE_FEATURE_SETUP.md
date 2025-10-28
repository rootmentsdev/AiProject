# Attendance Feature Setup Guide

## Overview
A complete attendance management system that fetches data from Google Sheets and displays it in a beautiful, searchable interface.

## 🎯 What Was Created

### Backend Components

1. **`backend/models/attendanceModel.js`**
   - Fetches attendance data from Google Sheet
   - Parses CSV data into structured format
   - Calculates attendance statistics (present, absent, leave)
   - Handles date range extraction

2. **`backend/controllers/attendanceController.js`**
   - `/api/attendance` - Get attendance data with summary statistics
   - `/api/attendance/export` - Export attendance data as JSON
   - Error handling for various scenarios (403, 404, timeouts)

3. **`backend/routes/attendanceRoutes.js`**
   - Route configuration for attendance endpoints

4. **`backend/server.js`** (Updated)
   - Registered attendance routes

### Frontend Components

5. **`frontend/src/components/AttendanceView.jsx`**
   - Beautiful UI with summary cards (Total, Present, Absent, Leave, Attendance Rate)
   - Searchable employee table
   - Auto-refresh functionality
   - Export to JSON feature
   - Real-time filtering
   - Responsive design

6. **`frontend/src/App.jsx`** (Updated)
   - Added "Attendance" tab to navigation
   - Integrated AttendanceView component

## 📊 Google Sheet Configuration

**Sheet URL:** https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit?gid=848974343#gid=848974343

**Sheet ID:** `1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg`
**GID (Tab ID):** `848974343`

### ⚠️ Important: Make Sheet Publicly Accessible

For the system to work, the Google Sheet must be publicly accessible:

1. Open the Google Sheet
2. Click "Share" (top right)
3. Click "Change to anyone with the link"
4. Set to "Viewer" access
5. Click "Done"

## 🚀 How to Use

### 1. Start the Backend Server

```bash
cd backend
npm start
```

The server will run on `http://localhost:5000`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Access the Attendance Page

1. Open your browser to `http://localhost:5173`
2. Click on the **"Attendance"** tab in the navigation bar
3. The attendance data will automatically load

## 🎨 Features

### Summary Dashboard
- **Total Employees** - Blue card
- **Present Count** - Green card
- **Absent Count** - Red card
- **Leave Count** - Orange card
- **Attendance Rate** - Purple card (calculated percentage)

### Employee Table
- Displays all employee data from the Google Sheet
- **Search functionality** - Filter employees by any field
- **Responsive design** - Works on all screen sizes
- **Status badges** - Color-coded status indicators (Present=Green, Absent=Red, Leave=Yellow)

### Actions
- **🔄 Refresh Data** - Reload attendance data from Google Sheet
- **📥 Export JSON** - Download attendance data as JSON file

## 📡 API Endpoints

### GET `/api/attendance`
Fetches attendance data from Google Sheet

**Response:**
```json
{
  "success": true,
  "data": {
    "headers": ["Name", "Status", "Date", ...],
    "employees": [
      {
        "name": "John Doe",
        "status": "Present",
        ...
      }
    ],
    "dateRange": "December 2024",
    "summary": {
      "totalEmployees": 50,
      "recordsFetched": "2024-10-28T..."
    }
  },
  "summary": {
    "totalEmployees": 50,
    "presentCount": 45,
    "absentCount": 3,
    "leaveCount": 2,
    "attendanceRate": 90.0
  },
  "totalRecords": 50,
  "fetchedAt": "2024-10-28T..."
}
```

### GET `/api/attendance/export`
Downloads attendance data as JSON file

## 🔧 Customization

### Change Google Sheet

Edit `backend/models/attendanceModel.js`:

```javascript
constructor() {
  this.SHEET_ID = 'YOUR_SHEET_ID';  // Change this
  this.GID = 'YOUR_GID';             // Change this
}
```

### Modify Attendance Status Logic

Edit the `calculateSummary()` method in `backend/models/attendanceModel.js` to change how attendance status is detected.

## 🐛 Troubleshooting

### "Access Denied" Error
- Make sure the Google Sheet is publicly accessible (see above)
- Check that the Sheet ID and GID are correct

### "Empty Response" Error
- Verify the Google Sheet URL is correct
- Ensure the sheet has data
- Check if the sheet/tab exists

### Data Not Showing
- Check browser console for errors (F12)
- Verify backend server is running (`http://localhost:5000`)
- Check backend logs for error messages

## 📝 Notes

- The system auto-loads attendance data on component mount
- All data is fetched in real-time from Google Sheets
- No database storage is required for attendance (fetched on-demand)
- Search is case-insensitive and searches across all fields
- Date range is automatically extracted from sheet headers if present

## ✅ Testing

1. Navigate to Attendance tab
2. Verify data loads automatically
3. Test search functionality
4. Try exporting data
5. Refresh and verify data updates

---

**Created:** October 28, 2024
**Tech Stack:** Node.js, Express, React, Bootstrap, Google Sheets API

