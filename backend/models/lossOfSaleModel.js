const axios = require('axios');

class LossOfSaleModel {
  constructor() {
    this.SHEET_ID = '1MDCSr0hNa9baAKEfw640T0fr2AyAokEpK9FYDJn-_Gs';
    
    // Store GID mapping
    this.STORE_GIDS = {
      'TRIVANDRUM': '0',
      'MG ROAD': '472777444',
      'EDAPALLY': '1644277494',
      'PERUMBAVOOR': '1527831850',
      'KOTTAYAM': '1526890305',
      'THRISSUR': '1686470443',
      'PALAKKAD': '1989740767',
      'CHAVAKKAD': '1641608132',
      'EDAPPAL': '335772714',
      'MANJERI': '273909184',
      'PERINTHALMANNA': '664513604',
      'KOTTAKKAL': '96343120',
      'CALICUT': '367741653',
      'VADAKARA': '1043801732',
      'KALPETTA': '1058040989',
      'KANNUR': '1881555117'
    };
  }

  /**
   * Fuzzy match store name to handle variations
   */
  fuzzyMatchStoreName(storeName) {
    const normalizedInput = storeName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    // Direct match first
    const directMatch = Object.keys(this.STORE_GIDS).find(
      key => key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedInput
    );
    if (directMatch) return directMatch;

    // Fuzzy match with common variations
    const storeAliases = {
      'TRIVANDRUM': ['trivandrum', 'tvm', 'thiruvananthapuram', 'sg'],
      'MG ROAD': ['mgroad', 'mg', 'ernakulam'],
      'EDAPALLY': ['edapally', 'edappally', 'edapal'],
      'PERUMBAVOOR': ['perumbavoor', 'perumbavur', 'pmvr'],
      'KOTTAYAM': ['kottayam', 'ktm'],
      'THRISSUR': ['thrissur', 'trichur', 'tcr'],
      'PALAKKAD': ['palakkad', 'palghat', 'pkd'],
      'CHAVAKKAD': ['chavakkad', 'chavakad', 'chvkd'],
      'EDAPPAL': ['edappal', 'edapal'],
      'MANJERI': ['manjeri', 'manjery', 'mjr'],
      'PERINTHALMANNA': ['perinthalmanna', 'pmna', 'pma'],
      'KOTTAKKAL': ['kottakkal', 'kottakal', 'ktk'],
      'CALICUT': ['calicut', 'kozhikode', 'clct', 'clt'],
      'VADAKARA': ['vadakara', 'vadakkara', 'vdk'],
      'KALPETTA': ['kalpetta', 'kalpeta', 'klp'],
      'KANNUR': ['kannur', 'cannanore', 'knr']
    };

    for (const [storeName, aliases] of Object.entries(storeAliases)) {
      if (aliases.some(alias => normalizedInput.includes(alias) || alias.includes(normalizedInput))) {
        return storeName;
      }
    }

    // If no match found, try partial match
    const partialMatch = Object.keys(this.STORE_GIDS).find(
      key => key.toLowerCase().includes(normalizedInput) || normalizedInput.includes(key.toLowerCase())
    );
    
    return partialMatch || null;
  }

  /**
   * Fetch loss of sale data for a specific store
   */
  async fetchStoreData(storeName) {
    // Try fuzzy matching first
    const matchedStoreName = this.fuzzyMatchStoreName(storeName);
    
    if (!matchedStoreName) {
      throw new Error(`Store "${storeName}" not found in mapping. Available stores: ${Object.keys(this.STORE_GIDS).join(', ')}`);
    }

    const gid = this.STORE_GIDS[matchedStoreName];
    if (!gid) {
      throw new Error(`Store "${matchedStoreName}" found but has no GID`);
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=${gid}`;
    
    // Log fuzzy match if names differ
    if (storeName.toUpperCase() !== matchedStoreName) {
      console.log(`🔍 Fuzzy matched "${storeName}" → "${matchedStoreName}"`);
    }
    console.log(`🔗 Fetching Loss of Sale for ${matchedStoreName} (GID: ${gid})`);

    try {
      const response = await axios.get(csvUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });

      return this.parseCSV(response.data, storeName);
    } catch (error) {
      console.error(`❌ Error fetching ${storeName}:`, error.message);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(`Access denied to Loss of Sale sheet. Please make the Google Sheet public: https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/edit`);
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid GID for ${storeName}. Please verify the GID is correct: ${gid}`);
      }
      
      throw new Error(`Failed to fetch ${storeName} data: ${error.message}`);
    }
  }

  /**
   * Parse CSV data into structured format
   */
  parseCSV(csvData, storeName) {
    const lines = csvData.split('\n');
    const entries = [];
    let currentMonth = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check if this is a month header (e.g., "JUNE LOSS OF SALE")
      if (line.includes('LOSS OF SALE') && !line.startsWith('DATE')) {
        currentMonth = line.split(' ')[0]; // Extract month name
        continue;
      }

      // Skip header rows
      if (line.startsWith('DATE') || line.startsWith('CUSTOMER NAME')) {
        continue;
      }

      // Parse data row
      const values = this.parseCSVLine(line);
      if (values.length < 6) continue; // Need at least date, name, number, function date, staff, reason

      const date = values[0]?.trim();
      if (!date || date === '') continue;

      // Parse date
      const parsedDate = this.parseDate(date);
      if (!parsedDate) continue;

      entries.push({
        date: parsedDate.formatted,
        day: parsedDate.day,
        month: parsedDate.month,
        year: parsedDate.year,
        customerName: values[1]?.trim() || 'N/A',
        number: values[2]?.trim() || 'N/A',
        functionDate: values[3]?.trim() || 'N/A',
        staffName: values[4]?.trim() || 'N/A',
        reason: values[5]?.trim() || 'N/A',
        comments: values[6]?.trim() || '',
        otherComments: values[7]?.trim() || '',  // Column H: What customer wanted
        productUnavailability: values[8]?.trim() || '',  // Column I: Product unavailability details
        competitor: values[9]?.trim() || '',  // Column J: Competitor info (if exists)
        storeName: storeName
      });
    }

    return entries;
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current); // Add last value
    return result;
  }

  /**
   * Parse various date formats
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Handle formats like "04-06-2025", "1 October 2025", "27 September 2025"
      let day, month, year;

      // Format: DD-MM-YYYY
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      }
      // Format: "D Month YYYY" or "DD Month YYYY"
      else if (dateStr.includes(' ')) {
        const parts = dateStr.split(' ');
        day = parseInt(parts[0]);
        year = parseInt(parts[2]);
        
        // Convert month name to number
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        month = monthNames.findIndex(m => m.toLowerCase() === parts[1].toLowerCase()) + 1;
      } else {
        return null;
      }

      if (!day || !month || !year) return null;

      return {
        day,
        month,
        year,
        formatted: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
      };
    } catch (error) {
      console.error(`Error parsing date "${dateStr}":`, error.message);
      return null;
    }
  }

  /**
   * Fetch loss of sale data for all stores
   */
  async fetchAllStoresData() {
    const allData = [];
    const errors = [];

    console.log(`📊 Fetching loss of sale data from ${Object.keys(this.STORE_GIDS).length} stores...`);

    for (const storeName of Object.keys(this.STORE_GIDS)) {
      try {
        const storeData = await this.fetchStoreData(storeName);
        allData.push(...storeData);
        console.log(`  ✅ ${storeName}: ${storeData.length} entries`);
      } catch (error) {
        console.error(`  ❌ ${storeName}: ${error.message}`);
        errors.push({ store: storeName, error: error.message });
      }
    }

    console.log(`\n✅ Total entries: ${allData.length}`);
    console.log(`⚠️ Failed stores: ${errors.length}`);

    return { data: allData, errors };
  }

  /**
   * Normalize date format for comparison (handles both "29/8/2025" and "04/06/2025")
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Filter data by specific date (handles date format variations)
   */
  filterByDate(data, targetDate) {
    // Normalize target date
    const normalizedTarget = this.normalizeDate(targetDate);
    
    console.log(`\n🔍 Filtering by date: ${targetDate} (normalized: ${normalizedTarget})`);
    
    const filtered = data.filter(entry => {
      const normalizedEntry = this.normalizeDate(entry.date);
      return normalizedEntry === normalizedTarget;
    });
    
    console.log(`✅ Found ${filtered.length} entries matching ${normalizedTarget}`);
    
    return filtered;
  }

  /**
   * Filter data by date range (with normalized dates)
   */
  filterByDateRange(data, startDate, endDate) {
    const normalizedStart = this.normalizeDate(startDate);
    const normalizedEnd = this.normalizeDate(endDate);
    
    return data.filter(entry => {
      const normalizedEntry = this.normalizeDate(entry.date);
      return normalizedEntry >= normalizedStart && normalizedEntry <= normalizedEnd;
    });
  }

  /**
   * Group data by store (with fuzzy matching)
   */
  groupByStore(data) {
    const grouped = {};
    
    data.forEach(entry => {
      // Use fuzzy matching to normalize store names
      const matchedStoreName = this.fuzzyMatchStoreName(entry.storeName) || entry.storeName.toUpperCase();
      
      if (!grouped[matchedStoreName]) {
        grouped[matchedStoreName] = [];
      }
      
      // Keep original store name but group under matched name
      grouped[matchedStoreName].push({
        ...entry,
        originalStoreName: entry.storeName, // Keep original for reference
        storeName: matchedStoreName // Use normalized name
      });
    });

    return grouped;
  }

  /**
   * Analyze reasons for loss of sale
   */
  analyzeReasons(data) {
    const reasonCounts = {};
    
    data.forEach(entry => {
      const reason = entry.reason.toLowerCase();
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    // Sort by frequency
    const sorted = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count }));

    return sorted;
  }
}

module.exports = new LossOfSaleModel();

