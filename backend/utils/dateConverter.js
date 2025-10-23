/**
 * Utility functions for date conversion between different formats
 */

/**
 * Convert DSR sheet date format (MM/DD/YYYY) to cancellation API format (YYYY-M-D)
 * @param {string} dsrDate - Date in format MM/DD/YYYY (e.g., "12/8/2025")
 * @returns {string} Date in format YYYY-M-D (e.g., "2025-12-8")
 */
function convertDSRDateToAPIDate(dsrDate) {
  if (!dsrDate) {
    console.log("⚠️ No DSR date provided, using default date");
    return "2025-12-8"; // Default to the known DSR sheet date
  }

  try {
    // Parse the DSR date (MM/DD/YYYY)
    const dateParts = dsrDate.split('/');
    if (dateParts.length !== 3) {
      throw new Error("Invalid date format");
    }

    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    // Validate date parts
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      throw new Error("Invalid date components");
    }

    // Convert to API format (YYYY-M-D)
    const apiDate = `${year}-${month}-${day}`;
    
    console.log(`📅 Converted DSR date "${dsrDate}" to API date "${apiDate}"`);
    return apiDate;

  } catch (error) {
    console.error("❌ Error converting DSR date:", error.message);
    console.log("🔄 Using default date: 2025-12-8");
    return "2025-12-8"; // Fallback to known DSR sheet date
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
