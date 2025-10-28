const axios = require('axios');

class AttendanceModel {
  constructor() {
    // Google Sheet configuration
    this.SHEET_ID = '1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg';
    
    // Month GIDs mapping - UPDATED WITH CORRECT VALUES
    this.MONTH_GIDS = {
      'JANUARY': '848974343',
      'FEBRUARY': '1578521144',
      'MARCH': '1507431974',
      'APRIL': '543795039',
      'MAY': '263387729',
      'JUNE': '853710573',
      'JULY': '1025929376',
      'AUGUST': '1932709133',
      'SEPTEMBER': '893799658',
      'OCTOBER': '563387222',
      'NOVEMBER': '10',      // ⚠️ UPDATE THIS if you have November tab
      'DECEMBER': '11'       // ⚠️ UPDATE THIS if you have December tab
    };
  }

  // Fetch attendance data based on DSR date
  async fetchAttendanceData(dsrDate = null) {
    try {
      console.log("\n📋 FETCHING ATTENDANCE DATA FROM GOOGLE SHEET...\n");
      
      // Determine which month to fetch
      let targetMonth, targetYear, currentDay;
      
      if (dsrDate) {
        const date = this.parseDSRDate(dsrDate);
        targetMonth = date.month;
        targetYear = date.year;
        currentDay = date.day;
        console.log(`📅 DSR Date: ${dsrDate} → Month: ${targetMonth}, Year: ${targetYear}, Day: ${currentDay}`);
      } else {
        // Use current date if no DSR date provided
        const now = new Date();
        targetMonth = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        targetYear = now.getFullYear();
        currentDay = now.getDate();
        console.log(`📅 Using current date → Month: ${targetMonth}, Year: ${targetYear}, Day: ${currentDay}`);
      }
      
      // Get GID for the target month
      const gid = this.MONTH_GIDS[targetMonth] || '848974343';
      
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=${gid}`;
      console.log(`🔗 CSV Export URL (${targetMonth} ${targetYear}):`, csvUrl);

      const response = await axios.get(csvUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.data || response.data.trim() === '') {
        throw new Error('Empty response from Google Sheets');
      }

      const lines = response.data.split('\n').filter(line => line.trim() !== '');
      console.log(`📊 Found ${lines.length} rows in attendance sheet`);
      
      // Parse CSV data with date filtering
      const attendanceData = this.parseAttendanceData(lines, currentDay, targetMonth, targetYear);
      
      console.log(`✅ Parsed ${attendanceData.employees.length} employee attendance records`);
      console.log(`📅 Showing attendance for: ${targetMonth} ${targetYear} (Days 1-${currentDay})`);
      
      return {
        success: true,
        data: attendanceData,
        rawData: response.data,
        totalRecords: attendanceData.employees.length,
        month: targetMonth,
        year: targetYear,
        currentDay: currentDay
      };

    } catch (error) {
      console.error("❌ Attendance data fetch failed:", error.message);
      throw error;
    }
  }

  // Parse DSR date format (e.g., "21/8/2025", "12/8/2025")
  parseDSRDate(dsrDateStr) {
    try {
      // Expected format: DD/M/YYYY or D/M/YYYY
      const parts = dsrDateStr.split('/');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
      const year = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      const monthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
      
      return {
        day: day,
        month: monthName,
        year: year,
        date: date
      };
    } catch (error) {
      console.error("❌ Failed to parse DSR date:", dsrDateStr);
      // Return current date as fallback
      const now = new Date();
      return {
        day: now.getDate(),
        month: now.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
        year: now.getFullYear(),
        date: now
      };
    }
  }

  parseAttendanceData(lines, currentDay, targetMonth, targetYear) {
    if (lines.length === 0) {
      return { employees: [], headers: [], dateRange: null };
    }

    // Parse CSV line (handles quoted values with commas)
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // Parse headers (first row)
    const allHeaders = parseCSVLine(lines[0]);
    console.log(`📋 Total Headers Found: ${allHeaders.length}`);
    console.log(`📋 First 6 Headers: ${allHeaders.slice(0, 6).join(' | ')}`);
    
    // Identify which columns are employee info vs. day columns
    // Sheet structure: [Empty], Branch, NORM, Designation, Employee Name, [Salary Advance], then day columns
    // We need to include up to Employee Name column
    const employeeInfoColumns = 5; // First 5 columns include Employee Name
    
    // Filter headers: Keep employee info columns + day columns up to currentDay
    const headers = [];
    const columnIndices = []; // Track which original columns to keep
    
    console.log(`\n📊 Column Filtering:`);
    
    for (let i = 0; i < allHeaders.length; i++) {
      const header = allHeaders[i];
      
      // Always keep employee info columns (first 5: [Empty], Branch, NORM, Designation, Employee Name)
      if (i < employeeInfoColumns) {
        headers.push(header);
        columnIndices.push(i);
        const colType = i === 0 ? 'Empty/Index' : i === 1 ? 'Branch' : i === 2 ? 'NORM' : i === 3 ? 'Designation' : i === 4 ? 'Employee Name' : 'Info';
        console.log(`   ✅ Column ${i}: "${header}" (${colType}) - INCLUDED`);
      } else {
        // For day columns, only include up to currentDay
        const dayNum = parseInt(header);
        if (!isNaN(dayNum) && dayNum <= currentDay) {
          headers.push(header);
          columnIndices.push(i);
          if (i < employeeInfoColumns + 3) { // Log first few day columns
            console.log(`   ✅ Column ${i}: "${header}" (Day ${dayNum}) - INCLUDED`);
          }
        } else if (!isNaN(dayNum)) {
          if (i < employeeInfoColumns + 3) { // Log first few skipped columns
            console.log(`   ⏭️  Column ${i}: "${header}" (Day ${dayNum}) - SKIPPED (beyond day ${currentDay})`);
          }
        }
      }
    }
    
    console.log(`\n📋 Final Headers (${headers.length} total):`, headers.slice(0, 10).join(', '), '...');

    // Parse employee data (subsequent rows)
    const employees = [];
    let skippedRows = 0;
    let branchCounts = {};
    
    for (let i = 1; i < lines.length; i++) {
      const allValues = parseCSVLine(lines[i]);
      
      // Skip completely empty rows
      if (allValues.length === 0) {
        skippedRows++;
        continue;
      }
      
      // Check if this is a separator row or header row (no employee name in column 4)
      const employeeName = allValues[4]?.trim(); // Employee Name is in column 4 (5th column)
      const branch = allValues[1]?.trim(); // Branch is in column 1 (2nd column)
      
      // Skip rows without employee name (separator rows, sub-headers, etc.)
      if (!employeeName || employeeName === '' || employeeName.toLowerCase() === 'employee name') {
        console.log(`⏭️  Skipping separator/header row ${i}: Branch="${branch}", Name="${employeeName}"`);
        skippedRows++;
        continue;
      }
      
      const employee = {};
      
      // Only include filtered columns
      headers.forEach((header, headerIndex) => {
        const originalIndex = columnIndices[headerIndex];
        const value = allValues[originalIndex] || '';
        
        // Clean header name for use as object key
        const key = header
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim()
          .replace(/\s+/g, '_')
          .toLowerCase();
        
        employee[key] = value;
      });
      
      // Track employees per branch
      if (branch) {
        branchCounts[branch] = (branchCounts[branch] || 0) + 1;
      }
      
      employees.push(employee);
    }
    
    // Log summary
    console.log(`\n📊 Employee Parsing Summary:`);
    console.log(`   Total Rows Processed: ${lines.length - 1}`);
    console.log(`   Employees Found: ${employees.length}`);
    console.log(`   Rows Skipped: ${skippedRows}`);
    console.log(`\n👥 Employees by Branch:`);
    for (const [branch, count] of Object.entries(branchCounts)) {
      console.log(`   ${branch}: ${count} employees`);
    }
    
    // Log first employee to verify data structure
    if (employees.length > 0) {
      console.log(`\n🔍 First Employee Data Sample:`);
      const firstEmployee = employees[0];
      const empKeys = Object.keys(firstEmployee);
      console.log(`   Keys (${empKeys.length}): ${empKeys.slice(0, 10).join(', ')}...`);
      console.log(`   Branch: ${firstEmployee.branch || 'N/A'}`);
      console.log(`   NORM: ${firstEmployee.norm || 'N/A'}`);
      console.log(`   Designation: ${firstEmployee.designation || 'N/A'}`);
      console.log(`   Employee Name: ${firstEmployee.employee_name || firstEmployee.name || 'N/A'}`);
    }
    console.log('');

    const dateRange = `${targetMonth} ${targetYear} (Days 1-${currentDay})`;

    return {
      headers: headers,
      employees: employees,
      dateRange: dateRange,
      summary: {
        totalEmployees: employees.length,
        recordsFetched: new Date().toISOString(),
        month: targetMonth,
        year: targetYear,
        daysShown: currentDay
      }
    };
  }

  extractDateRange(text) {
    // Try to extract date range from text
    // Common formats: "December 2024", "Dec 1-31, 2024", "Week of Dec 15"
    const datePatterns = [
      /(\w+\s+\d{4})/i, // December 2024
      /(\w+\s+\d{1,2}-\d{1,2},\s+\d{4})/i, // Dec 1-31, 2024
      /(\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4})/i // 12/1/2024 - 12/31/2024
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  // Calculate attendance summary statistics
  calculateSummary(attendanceData) {
    const employees = attendanceData.employees || [];
    const headers = attendanceData.headers || [];
    
    if (employees.length === 0) {
      return {
        totalEmployees: 0,
        totalPresentDays: 0,
        totalAbsentDays: 0,
        totalLeaveDays: 0,
        totalWeeklyOffDays: 0,
        attendanceRate: 0,
        daysTracked: 0
      };
    }

    // Count attendance across all employees for all tracked days
    let totalPresentDays = 0;
    let totalAbsentDays = 0;
    let totalLeaveDays = 0;
    let totalWeeklyOffDays = 0;
    let totalLOPDays = 0;
    let totalWorkingDays = 0;

    employees.forEach(emp => {
      // Iterate through all day columns (skip employee info columns)
      Object.keys(emp).forEach(key => {
        const value = (emp[key] || '').toString().trim().toLowerCase();
        
        // Skip non-day columns (employee info)
        if (['branch', 'norm', 'designation', 'employee_name', 'name'].includes(key)) {
          return;
        }
        
        // Count attendance status
        if (value === 'p') {
          totalPresentDays++;
          totalWorkingDays++;
        } else if (value === 'a') {
          totalAbsentDays++;
          totalWorkingDays++;
        } else if (value === 'l' || value === 'al') {
          totalLeaveDays++;
        } else if (value === 'w/o') {
          totalWeeklyOffDays++;
        } else if (value === 'lop') {
          totalLOPDays++;
          totalWorkingDays++;
        } else if (value === 'h/d' || value === 'm' || value === 'ckd') {
          // Half day, morning, checked - count as present
          totalPresentDays++;
          totalWorkingDays++;
        }
      });
    });

    const totalEmployees = employees.length;
    const daysTracked = attendanceData.summary?.daysShown || 0;
    
    // Calculate attendance rate (present days / total working days)
    const attendanceRate = totalWorkingDays > 0 
      ? ((totalPresentDays / totalWorkingDays) * 100).toFixed(2) 
      : 0;

    return {
      totalEmployees,
      totalPresentDays,
      totalAbsentDays,
      totalLeaveDays,
      totalWeeklyOffDays,
      totalLOPDays,
      attendanceRate: parseFloat(attendanceRate),
      daysTracked: daysTracked,
      totalWorkingDays: totalWorkingDays
    };
  }
}

module.exports = new AttendanceModel();

