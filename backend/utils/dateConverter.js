/**
 * Utility functions for date conversion between different formats
 */

/**
 * Convert DSR sheet date format to cancellation API format (YYYY-M-D)
 * Tries both MM/DD/YYYY and DD/MM/YYYY formats
 * @param {string} dsrDate - Date in format MM/DD/YYYY or DD/MM/YYYY (e.g., "12/8/2025" or "8/12/2025")
 * @returns {string} Date in format YYYY-M-D (e.g., "2025-8-12")
 */
function convertDSRDateToAPIDate(dsrDate) {
  if (!dsrDate) {
    console.log("⚠️ No DSR date provided, using default date");
    return "2025-8-12"; // Default to August 12, 2025 (DD/MM format: 12/8/2025)
  }

  try {
    // Parse the DSR date
    const dateParts = dsrDate.split('/');
    if (dateParts.length !== 3) {
      throw new Error("Invalid date format");
    }

    const part1 = parseInt(dateParts[0], 10);
    const part2 = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    // Validate date parts
    if (isNaN(part1) || isNaN(part2) || isNaN(year)) {
      throw new Error("Invalid date components");
    }

    // Try to determine format by checking which interpretation is valid
    // If part1 > 12, it must be DD/MM/YYYY format
    // Otherwise, check if MM/DD/YYYY or DD/MM/YYYY makes more sense
    let month, day, format;
    
    if (part1 > 12) {
      // Must be DD/MM/YYYY
      day = part1;
      month = part2;
      format = "DD/MM/YYYY";
    } else if (part2 > 12) {
      // Must be MM/DD/YYYY
      month = part1;
      day = part2;
      format = "MM/DD/YYYY";
    } else {
      // Ambiguous - both could be valid
      // Default to DD/MM/YYYY (Indian/European format) 
      day = part1;
      month = part2;
      format = "DD/MM/YYYY (assumed)";
      console.log(`⚠️ Ambiguous date format for "${dsrDate}" - assuming DD/MM/YYYY`);
      console.log(`   If incorrect, use frontend date override with YYYY-M-D format`);
    }

    // Validate month and day ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date: month=${month}, day=${day}`);
    }

    // Convert to API format (YYYY-M-D)
    const apiDate = `${year}-${month}-${day}`;
    
    console.log(`📅 Converted DSR date "${dsrDate}" (${format}) to API date "${apiDate}"`);
    return apiDate;

  } catch (error) {
    console.error("❌ Error converting DSR date:", error.message);
    console.log("🔄 Using default date: 2025-8-12");
    return "2025-8-12"; // Fallback to August 12, 2025
  }
}

/**
 * Convert DSR sheet date format (MM/DD/YYYY) to a date range for cancellation API
 * @param {string} dsrDate - Date in format MM/DD/YYYY (e.g., "12/8/2025")
 * @returns {Object} Object with DateFrom and DateTo in API format
 */
function convertDSRDateToDateRange(dsrDate) {
  const apiDate = convertDSRDateToAPIDate(dsrDate);
  
  return {
    DateFrom: apiDate,
    DateTo: apiDate // Same date for both from and to (single day analysis)
  };
}

/**
 * Get date range for cancellation analysis based on DSR sheet date
 * @param {string} dsrDate - Date from DSR sheet
 * @param {number} daysBefore - Number of days before DSR date to include (default: 0)
 * @param {number} daysAfter - Number of days after DSR date to include (default: 0)
 * @returns {Object} Object with DateFrom and DateTo in API format
 */
function getCancellationDateRange(dsrDate, daysBefore = 0, daysAfter = 0) {
  try {
    const dateParts = dsrDate.split('/');
    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    // Create Date object
    const baseDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor

    // Calculate from date
    const fromDate = new Date(baseDate);
    fromDate.setDate(fromDate.getDate() - daysBefore);

    // Calculate to date
    const toDate = new Date(baseDate);
    toDate.setDate(toDate.getDate() + daysAfter);

    // Convert to API format
    const dateFrom = `${fromDate.getFullYear()}-${fromDate.getMonth() + 1}-${fromDate.getDate()}`;
    const dateTo = `${toDate.getFullYear()}-${toDate.getMonth() + 1}-${toDate.getDate()}`;

    console.log(`📅 Generated date range: ${dateFrom} to ${dateTo} (based on DSR date: ${dsrDate})`);

    return {
      DateFrom: dateFrom,
      DateTo: dateTo
    };

  } catch (error) {
    console.error("❌ Error generating date range:", error.message);
    // Fallback to single day
    const apiDate = convertDSRDateToAPIDate(dsrDate);
    return {
      DateFrom: apiDate,
      DateTo: apiDate
    };
  }
}

module.exports = {
  convertDSRDateToAPIDate,
  convertDSRDateToDateRange,
  getCancellationDateRange
};
