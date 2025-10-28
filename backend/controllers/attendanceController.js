const attendanceModel = require('../models/attendanceModel');

class AttendanceController {
  async getAttendance(req, res) {
    try {
      console.log("\n" + "=".repeat(80));
      console.log("📋 ATTENDANCE DATA REQUEST RECEIVED");
      console.log("=".repeat(80));
      console.log("⏰ Time:", new Date().toLocaleString());
      console.log("📍 Endpoint: GET /api/attendance");
      console.log("=".repeat(80) + "\n");
      
      // Get DSR date to determine which month's attendance to show
      let dsrDate = null;
      try {
        const dsrModel = require('../models/dsrModel');
        const dsrDataResult = await dsrModel.fetchSheetData();
        dsrDate = dsrDataResult.date || dsrDataResult.northDate;
        console.log(`📅 DSR Sheet Date: ${dsrDate}`);
      } catch (dsrError) {
        console.log("⚠️ Could not fetch DSR date, using current date");
      }
      
      // Fetch attendance data from Google Sheet (for the DSR month)
      const result = await attendanceModel.fetchAttendanceData(dsrDate);
      
      if (!result.success) {
        console.error("❌ Failed to fetch attendance data");
        return res.status(400).json({ 
          error: "Failed to fetch attendance data from Google Sheet" 
        });
      }

      // Calculate summary statistics
      const summary = attendanceModel.calculateSummary(result.data);
      
      console.log('\n✅ ATTENDANCE DATA FETCHED SUCCESSFULLY!');
      console.log(`📅 Month: ${result.month} ${result.year} (Days 1-${result.currentDay})`);
      console.log(`📊 Total Employees: ${summary.totalEmployees}`);
      console.log(`📊 Days Tracked: ${summary.daysTracked}`);
      console.log(`✅ Present Days: ${summary.totalPresentDays}`);
      console.log(`❌ Absent Days: ${summary.totalAbsentDays}`);
      console.log(`🏖️ Leave Days: ${summary.totalLeaveDays}`);
      console.log(`🏠 Weekly Off Days: ${summary.totalWeeklyOffDays}`);
      console.log(`💸 LOP Days: ${summary.totalLOPDays}`);
      console.log(`📈 Attendance Rate: ${summary.attendanceRate}%`);
      console.log('📊 Sending response to frontend...\n');
      
      res.json({
        success: true,
        data: result.data,
        summary: summary,
        totalRecords: result.totalRecords,
        month: result.month,
        year: result.year,
        currentDay: result.currentDay,
        dsrDate: dsrDate,
        fetchedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("❌ Attendance data fetch failed:", error.message);
      console.error("❌ Error details:", error.stack);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("\n🔒 PERMISSION DENIED - SHEET IS PRIVATE!");
        console.error("📋 To fix this:");
        console.error("   1. Open: https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit");
        console.error("   2. Click 'Share' (top-right corner)");
        console.error("   3. Under 'General access', click 'Restricted'");
        console.error("   4. Select 'Anyone with the link'");
        console.error("   5. Set to 'Viewer'");
        console.error("   6. Click 'Done'\n");
        
        return res.status(400).json({ 
          error: "🔒 Google Sheet is PRIVATE. Please make it publicly accessible.",
          instructions: [
            "1. Open the Google Sheet",
            "2. Click 'Share' button (top-right)",
            "3. Change 'Restricted' to 'Anyone with the link'",
            "4. Set permission to 'Viewer'",
            "5. Click 'Done' and try again"
          ],
          sheetUrl: "https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit"
        });
      } else if (error.response?.status === 400) {
        console.error("\n❌ BAD REQUEST - WRONG MONTH GID!");
        console.error(`📋 The GID for the current month is INCORRECT`);
        console.error(`💡 Test all months: http://localhost:5000/api/attendance/test-all-months\n`);
        
        return res.status(400).json({ 
          error: "❌ Wrong month GID! The tab for this month doesn't exist with the configured GID.",
          instructions: [
            "1. Open: https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit",
            "2. Click on the month tab you need at the bottom",
            "3. Copy the GID from URL (after #gid=)",
            "4. Update MONTH_GIDS in backend/models/attendanceModel.js",
            "5. Or test all months: http://localhost:5000/api/attendance/test-all-months"
          ],
          hint: "Open backend/models/attendanceModel.js and update the GID for this month",
          testUrl: "http://localhost:5000/api/attendance/test-all-months"
        });
      } else if (error.response?.status === 404) {
        return res.status(400).json({ 
          error: "Google Sheet or tab not found. Please check the Sheet ID and month GID configuration.",
          hint: "Check MONTH_GIDS in backend/models/attendanceModel.js"
        });
      } else if (error.code === 'ECONNABORTED') {
        return res.status(500).json({ 
          error: "Request timeout. The sheet might be too large or slow to access." 
        });
      }
      
      res.status(500).json({ 
        error: `Failed to fetch attendance data: ${error.message}`,
        hint: "Check backend console logs for details"
      });
    }
  }

  // Export attendance data as JSON
  async exportAttendance(req, res) {
    try {
      console.log("📤 Exporting attendance data...");
      
      const result = await attendanceModel.fetchAttendanceData();
      
      if (!result.success) {
        return res.status(400).json({ error: "Failed to fetch attendance data" });
      }

      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.json`);
      
      res.json(result.data);
      
      console.log("✅ Attendance data exported successfully");
      
    } catch (error) {
      console.error("❌ Export failed:", error.message);
      res.status(500).json({ error: `Export failed: ${error.message}` });
    }
  }
}

module.exports = new AttendanceController();

