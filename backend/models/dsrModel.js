const axios = require('axios');
const dsrPrompts = require('../config/dsrPrompts');

class DSRModel {
  // Hardcoded Google Sheet configuration
  constructor() {
    this.SHEET_ID = '1MBcdsEJuaX4c8B0cHrBHxyr6cbOO3HWnm5vFZ7awYeU';
    this.SOUTH_CLUSTER_GID = '950221771'; // South Cluster sheet
    this.NORTH_CLUSTER_GID = '866283026'; // North Cluster sheet
    this.lastUsedModel = null;
  }

  async fetchSheetData() {
    console.log("\n🌍 FETCHING DATA FROM BOTH NORTH AND SOUTH CLUSTERS...\n");
    
    // Fetch South Cluster data
    console.log("📍 Fetching SOUTH CLUSTER data...");
    const southData = await this.fetchSingleSheetData(this.SOUTH_CLUSTER_GID, 'South Cluster');
    
    // Fetch North Cluster data
    console.log("\n📍 Fetching NORTH CLUSTER data...");
    const northData = await this.fetchSingleSheetData(this.NORTH_CLUSTER_GID, 'North Cluster');
    
    // Combine both datasets
    const combinedData = `${southData.data}\n${northData.data}`;
    
    // Combine walk-ins data from both clusters
    const combinedWalkIns = {
      ...southData.storeWalkIns,
      ...northData.storeWalkIns
    };
    
    // Use the MOST RECENT date (North is usually more current)
    // This ensures we fetch cancellations for the correct date
    const sheetDate = northData.date || southData.date;
    
    console.log("\n✅ COMBINED DATA FROM BOTH CLUSTERS");
    console.log(`📊 Total rows: South (${southData.rowCount}) + North (${northData.rowCount}) = ${southData.rowCount + northData.rowCount}`);
    console.log(`📅 South Cluster Date: ${southData.date}`);
    console.log(`📅 North Cluster Date: ${northData.date}`);
    console.log(`📅 Using date for cancellation/staff analysis: ${sheetDate}`);
    console.log(`👥 Combined walk-ins for ${Object.keys(combinedWalkIns).length} stores`);
    
    // Store the extracted date for use in cancellation analysis
    this.sheetDate = sheetDate;
    
    return {
      data: combinedData,
      date: sheetDate,
      southDate: southData.date,
      northDate: northData.date,
      storeWalkIns: combinedWalkIns // Add combined walk-ins to return value
    };
  }

  // Helper function to properly parse CSV lines (handles quoted values with commas)
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
    result.push(current); // Push the last value
    
    return result;
  }

  async fetchSingleSheetData(gid, clusterName) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=${gid}`;
    console.log(`🔗 CSV Export URL (${clusterName}):`, csvUrl);

    const response = await axios.get(csvUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.data || response.data.trim() === '') {
      throw new Error(`Empty response from Google Sheets (${clusterName})`);
    }

    const lines = response.data.split('\n');
    console.log(`📊 Found ${lines.length} rows in ${clusterName} sheet`);
    
    // Parse DSR data specifically for Suitor Guy Kerala stores
    let dsrData = '';
    let headerFound = false;
    let dataRows = 0;
    let sheetDate = null;
    const storeWalkIns = {}; // Store walk-in data by store name
    
    // Find the header row and extract store data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Extract date from the sheet (look for date patterns like 12/8/2025, 21/8/2025)
      if (!sheetDate && line.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
        sheetDate = line.match(/\d{1,2}\/\d{1,2}\/\d{4}/)[0];
        console.log(`📅 Found ${clusterName} date: ${sheetDate}`);
      }
      
      // Look for header row (contains STORE, FTD, MTD, L2L)
      if (line.includes('STORE') && line.includes('FTD') && line.includes('MTD')) {
        dsrData += `Header Row (${clusterName}): ${line}\n`;
        headerFound = true;
        continue;
      }
      
      // Include store data rows (skip empty rows and totals)
      if (headerFound && line.includes(',') && 
          !line.includes('SUITOR GUY') &&
          !line.includes('TOTAL') &&
          !line.includes('North Shoes') &&
          !line.includes('SOUTH SHOES') &&
          !line.includes('Store,Target') &&
          line.split(',').length > 5) {
        
        // Extract store name and key metrics using proper CSV parsing
        const columns = this.parseCSVLine(line);
        
        // Store name is in Column 1 (index 1) - Column B in the sheet
        const storeName = columns[1]?.trim();
        
        if (storeName && storeName !== '' && 
            !storeName.includes('SUITOR') && 
            !storeName.includes('Store') &&
            !storeName.includes('Target')) {
          
          // Walk-ins (FTD) column varies by cluster:
          // - South Cluster: Column O (index 14) - rows O4 to O12
          // - North Cluster: Column R (index 17) - rows R5 to R14
          const walkInColumnIndex = clusterName === 'South Cluster' ? 14 : 17;
          const walkInsStr = columns[walkInColumnIndex]?.replace(/,/g, '') || '';
          const walkInsFTD = parseInt(walkInsStr || '0');
          
          // Only store walk-ins if:
          // 1. Store doesn't already have walk-ins data (avoid duplicates)
          // 2. OR the new value is non-zero (update zeros with actual data)
          if (!storeWalkIns[storeName] || walkInsFTD > 0) {
            // DEBUG: Log extracted data
            console.log(`👥 Extracted: Store="${storeName}", Walk-ins=${walkInsFTD} (${clusterName}, Column[${walkInColumnIndex}]="${columns[walkInColumnIndex]}")`);
            
            // Store walk-ins data
            storeWalkIns[storeName] = walkInsFTD;
          } else {
            console.log(`⏭️  Skipped duplicate: Store="${storeName}", Walk-ins=${walkInsFTD} (already have: ${storeWalkIns[storeName]})`);
          }
          
          dsrData += `Store Data (${clusterName}): ${line}\n`;
          dataRows++;
        }
      }
    }

    console.log(`📊 Processed ${dataRows} store data rows from ${clusterName}`);
    console.log(`\n${'='.repeat(80)}`);
    console.log(`👥 WALK-INS EXTRACTED FROM ${clusterName.toUpperCase()}:`);
    console.log(`${'='.repeat(80)}`);
    Object.entries(storeWalkIns).forEach(([store, walkIns]) => {
      console.log(`   📍 ${store}: ${walkIns} walk-ins`);
    });
    console.log(`${'='.repeat(80)}\n`);
    
    return {
      data: dsrData,
      date: sheetDate,
      rowCount: dataRows,
      storeWalkIns: storeWalkIns // Add walk-ins data to return value
    };
  }

  async analyzeWithAI(dsrData, retryCount = 0) {
    // Handle both old string format and new object format
    const dataToAnalyze = typeof dsrData === 'object' ? dsrData.data : dsrData;
    const maxRetries = 3;
    const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
    
    console.log("🔑 Groq API Key check:", GROQ_API_KEY ? "Found" : "Missing");
    console.log("🔑 Groq API Key length:", GROQ_API_KEY?.length || 0);
    console.log("🔑 Gemini API Key check:", GEMINI_API_KEY ? "Found" : "Missing");
    console.log("🔑 Gemini API Key length:", GEMINI_API_KEY?.length || 0);
    
    if (!GROQ_API_KEY && !GEMINI_API_KEY) {
      throw new Error('No AI API keys found. Please add GROQ_API_KEY or GEMINI_API_KEY to .env');
    }

    const prompt = dsrPrompts.getDSRAnalysisPrompt(dataToAnalyze);

    // Try Groq first (if API key exists)
    if (GROQ_API_KEY) {
      try {
        // Groq models - super fast and free! (Updated to current models)
        const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
        const selectedModel = models[retryCount] || models[0];
        
        console.log(`📨 Sending DSR analysis request to Groq using ${selectedModel}... (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: selectedModel,
          messages: [
            { role: "system", content: "You are a retail performance analyst specializing in Daily Sales Report (DSR) analysis. Provide structured, actionable insights for store improvement." },
            { role: "user", content: prompt }
          ],
          max_tokens: 5000,
          temperature: 0.1
        }, {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        // Track which model was used
        this.lastUsedModel = `Groq: ${selectedModel}`;

        // 🎯 CAPTURE TOKEN USAGE
        const tokenUsage = response.data.usage || {};
        const promptTokens = tokenUsage.prompt_tokens || 0;
        const completionTokens = tokenUsage.completion_tokens || 0;
        const totalTokens = tokenUsage.total_tokens || 0;

        const raw = response.data.choices[0].message.content;
        console.log("🔍 Raw AI Response (DSR Analysis):", raw);
        
        if (!raw || raw.trim() === '') {
          throw new Error("AI service returned empty response. Please try again.");
        }
        
        // Clean and parse the JSON response
        const cleanedResponse = this.cleanJSON(raw);
        
        try {
          const parsed = JSON.parse(cleanedResponse);
          console.log("✅ Successfully parsed DSR analysis from Groq");
          console.log("📊 Total stores in response:", parsed.analysisSummary?.totalStores);
          console.log("🔴 Bad performing stores count:", parsed.analysisSummary?.badPerformingStores);
          console.log("📋 Bad performing stores array length:", parsed.badPerformingStores?.length);
          if (parsed.badPerformingStores && parsed.badPerformingStores.length > 0) {
            console.log("📋 First 3 bad performing stores:");
            parsed.badPerformingStores.slice(0, 3).forEach((store, i) => {
              console.log(`   ${i+1}. ${store.storeName} - Conv: ${store.conversionRate}, ABS: ${store.absValue}, ABV: ${store.abvValue}, Failed: ${store.criteriaFailed}`);
            });
          }
          
          // 🎨 DISPLAY TOKEN USAGE IN EYE-CATCHING FORMAT
          this.displayTokenUsage('DSR Analysis', promptTokens, completionTokens, totalTokens, 'Groq');
          
          // Attach token usage to parsed response
          parsed.tokenUsage = { promptTokens, completionTokens, totalTokens };
          
          return parsed;
        } catch (parseError) {
          console.error("❌ JSON Parse Error from Groq:", parseError.message);
          console.error("📄 Raw Response (first 500 chars):", raw.substring(0, 500));
          console.error("🧹 Cleaned Response (first 500 chars):", cleanedResponse.substring(0, 500));
          console.error("🔍 Error position:", parseError.message.match(/position (\d+)/)?.[1]);
          
          // Show the problematic area
          const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
          if (pos > 0) {
            const start = Math.max(0, pos - 50);
            const end = Math.min(cleanedResponse.length, pos + 50);
            console.error(`📍 Context around error (pos ${pos}):`);
            console.error(`   "${cleanedResponse.substring(start, end)}"`);
          }
          
          throw parseError; // Re-throw to trigger Gemini fallback
        }
        
      } catch (groqError) {
        console.error("❌ Groq API Failed:", groqError.message);
        console.error("❌ Error code:", groqError.code);
        console.error("❌ Response status:", groqError.response?.status);
        
        // If rate limit (429) or other errors, try Gemini
        if (GEMINI_API_KEY && (groqError.response?.status === 429 || groqError.response?.status === 401 || retryCount >= maxRetries)) {
          console.log("🔄 Groq failed, switching to Google Gemini...");
          // Continue to Gemini below
        } else if (retryCount < maxRetries && (groqError.code === 'ECONNRESET' || groqError.code === 'ETIMEDOUT')) {
          console.log(`🔄 Retrying Groq in 2 seconds... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.analyzeWithAI(dsrData, retryCount + 1);
        } else {
          throw groqError; // No Gemini key or not retryable, throw error
        }
      }
    }
    
    // Try Google Gemini (if Groq failed or no Groq key)
    if (GEMINI_API_KEY) {
      try {
        console.log("📨 Sending DSR analysis request to Google Gemini...");
        
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `You are a retail performance analyst specializing in Daily Sales Report (DSR) analysis. Provide structured, actionable insights for store improvement.\n\n${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8000
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 40000
          }
        );

        // Track which model was used
        this.lastUsedModel = 'Google Gemini 1.5 Flash';

        // 🎯 CAPTURE TOKEN USAGE FROM GEMINI
        const tokenUsage = response.data.usageMetadata || {};
        const promptTokens = tokenUsage.promptTokenCount || 0;
        const completionTokens = tokenUsage.candidatesTokenCount || 0;
        const totalTokens = tokenUsage.totalTokenCount || 0;

        const raw = response.data.candidates[0].content.parts[0].text;
        console.log("🔍 Raw AI Response from Gemini:", raw);
        
        if (!raw || raw.trim() === '') {
          throw new Error("Gemini returned empty response. Please try again.");
        }
        
        // Clean and parse the JSON response
        const cleanedResponse = this.cleanJSON(raw);
        
        try {
          const parsed = JSON.parse(cleanedResponse);
          console.log("✅ Successfully parsed DSR analysis from Gemini");
          console.log("📊 Total stores in response:", parsed.analysisSummary?.totalStores);
          console.log("🔴 Bad performing stores count:", parsed.analysisSummary?.badPerformingStores);
          console.log("📋 Bad performing stores array length:", parsed.badPerformingStores?.length);
          if (parsed.badPerformingStores && parsed.badPerformingStores.length > 0) {
            console.log("📋 First 3 bad performing stores:");
            parsed.badPerformingStores.slice(0, 3).forEach((store, i) => {
              console.log(`   ${i+1}. ${store.storeName} - Conv: ${store.conversionRate}, ABS: ${store.absValue}, ABV: ${store.abvValue}, Failed: ${store.criteriaFailed}`);
            });
          }
          
          // 🎨 DISPLAY TOKEN USAGE IN EYE-CATCHING FORMAT
          this.displayTokenUsage('DSR Analysis', promptTokens, completionTokens, totalTokens, 'Gemini');
          
          // Attach token usage to parsed response
          parsed.tokenUsage = { promptTokens, completionTokens, totalTokens };
          
          return parsed;
        } catch (parseError) {
          console.error("❌ JSON Parse Error from Gemini:", parseError.message);
          console.log("🔄 Creating fallback response");
          return this.createFallbackResponse(dsrData);
        }
        
      } catch (geminiError) {
        console.error("❌ Gemini API Failed:", geminiError.message);
        console.error("❌ Error code:", geminiError.code);
        console.error("❌ Response status:", geminiError.response?.status);
        console.error("❌ Response data:", geminiError.response?.data);
        
        // Both APIs failed, use fallback
        console.log("🔄 All AI providers failed, using fallback response");
        return this.createFallbackResponse(dsrData);
      }
    }
    
    // If we reach here, no API keys were available or both failed
    console.log("🔄 No working AI provider, using fallback response");
    return this.createFallbackResponse(dsrData);
  }

  cleanJSON(jsonString) {
    let cleaned = jsonString.trim();
    
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    
    // Remove any text before the first {
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      const firstBrace = cleaned.search(/[{\[]/);
      if (firstBrace !== -1) {
        cleaned = cleaned.substring(firstBrace);
      }
    }
    
    // Remove any text after the last } or ]
    const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // ✅ ULTIMATE FIX: Properly escape quotes inside JSON string values
    // The issue: AI returns strings like "text with "quotes" inside"
    // Solution: Parse line by line and fix quoted strings
    
    const lines = cleaned.split('\n');
    const fixedLines = [];
    
    for (const line of lines) {
      // Match pattern: "propertyName": "value with possible "nested" quotes"
      // Strategy: Find lines with : " pattern and fix the value part
      const colonQuoteIndex = line.indexOf('": "');
      
      if (colonQuoteIndex === -1) {
        // No string value on this line, keep as-is
        fixedLines.push(line);
        continue;
      }
      
      // Split into: prefix (up to ": ") + value part (after ": ")
      const prefix = line.substring(0, colonQuoteIndex + 3); // includes ": "
      const afterPrefix = line.substring(colonQuoteIndex + 4); // after ": "
      
      // Find where the string value ends (look for closing ", or "\n or "})
      let endIndex = -1;
      let depth = 0;
      
      for (let i = 0; i < afterPrefix.length; i++) {
        const char = afterPrefix[i];
        const nextChar = i < afterPrefix.length - 1 ? afterPrefix[i + 1] : '';
        
        if (char === '"' && (nextChar === ',' || nextChar === '\n' || nextChar === ' ' || nextChar === '}' || i === afterPrefix.length - 1)) {
          endIndex = i;
          break;
        }
      }
      
      if (endIndex === -1) {
        // Couldn't find end, keep line as-is
        fixedLines.push(line);
        continue;
      }
      
      // Extract the value content (between quotes)
      const valueContent = afterPrefix.substring(0, endIndex);
      const suffix = afterPrefix.substring(endIndex); // includes closing " and rest
      
      // Replace any double quotes in the value with single quotes
      const fixedValue = valueContent.replace(/"/g, "'");
      
      // Reconstruct the line
      fixedLines.push(prefix + '"' + fixedValue + suffix);
    }
    
    cleaned = fixedLines.join('\n');
    
    // Fix common JSON syntax errors
    // 1. Fix missing quotes around percentage values
    cleaned = cleaned.replace(/:\s*(\d+\.?\d*%)/g, ': "$1"');
    
    // 2. Fix trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // 3. Fix missing commas between properties
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"');
    cleaned = cleaned.replace(/(\d+)\s*\n\s*"/g, '$1,\n"');
    cleaned = cleaned.replace(/"\s*\n\s*(\d+)/g, '",\n$1');
    cleaned = cleaned.replace(/}(\s*")/g, '},$1');
    cleaned = cleaned.replace(/](\s*")/g, '],$1');
    
    // 4. Fix multiple consecutive commas
    cleaned = cleaned.replace(/,+/g, ',');
    
    return cleaned;
  }

  createFallbackResponse(dsrData) {
    console.log("🔄 Creating fallback response due to JSON parsing error");
    
    return {
      analysisSummary: {
        totalStores: "15",
        badPerformingStores: "0",
        analysisPeriod: "December 2025",
        keyFindings: "AI analysis encountered a formatting issue. Unable to analyze stores automatically. Please retry the analysis."
      },
      // ✅ FIX: Add badPerformingStores field that compareStores expects
      badPerformingStores: [],
      // Fallback data for compatibility
      storePerformance: [
        {
          storeName: "Analysis Pending",
          performance: "UNKNOWN",
          billsL2L: "N/A",
          qtyL2L: "N/A",
          walkInL2L: "N/A",
          conversionRate: "N/A",
          keyIssues: ["AI response formatting error"],
          recommendations: ["Retry analysis"],
          priority: "HIGH"
        }
      ],
      recommendations: {
        immediate: ["Retry the integrated analysis"],
        shortTerm: ["AI will automatically retry with different model"],
        longTerm: ["System will learn from this error"]
      },
      errorNote: "JSON parsing failed. This is a temporary issue. Please retry the analysis - the system will automatically use a backup AI model."
    };
  }

  // 🎨 EYE-CATCHING TOKEN USAGE DISPLAY
  displayTokenUsage(callType, promptTokens, completionTokens, totalTokens, provider) {
    const width = 80;
    const line = '═'.repeat(width);
    const doubleLine = '╔' + line + '╗';
    const bottomLine = '╚' + line + '╝';
    
    console.log('');
    console.log(`\n${doubleLine}`);
    console.log('║' + ' '.repeat(width) + '║');
    console.log('║' + this.centerText(`💰 TOKEN USAGE REPORT 💰`, width) + '║');
    console.log('║' + ' '.repeat(width) + '║');
    console.log('╠' + line + '╣');
    console.log('║' + ' '.repeat(width) + '║');
    console.log('║' + this.formatLine(`📋 Call Type:`, callType, width) + '║');
    console.log('║' + this.formatLine(`🤖 AI Provider:`, provider, width) + '║');
    console.log('║' + ' '.repeat(width) + '║');
    console.log('╠' + line + '╣');
    console.log('║' + ' '.repeat(width) + '║');
    console.log('║' + this.formatLine(`📥 Prompt Tokens:`, promptTokens.toLocaleString(), width) + '║');
    console.log('║' + this.formatLine(`📤 Completion Tokens:`, completionTokens.toLocaleString(), width) + '║');
    console.log('║' + ' '.repeat(width) + '║');
    console.log('╠' + line + '╣');
    console.log('║' + ' '.repeat(width) + '║');
    console.log('║' + this.formatLine(`🎯 TOTAL TOKENS:`, `✨ ${totalTokens.toLocaleString()} ✨`, width, true) + '║');
    console.log('║' + ' '.repeat(width) + '║');
    
    // Calculate estimated cost (Groq is free, but show for reference)
    const estimatedCost = provider === 'Groq' 
      ? 'FREE (100k tokens/day limit)' 
      : provider === 'Gemini'
      ? 'FREE (1.5M tokens/day limit)'
      : `~$${(totalTokens * 0.0001).toFixed(4)}`;
    
    console.log('╠' + line + '╣');
    console.log('║' + ' '.repeat(width) + '║');
    console.log('║' + this.formatLine(`💵 Estimated Cost:`, estimatedCost, width) + '║');
    console.log('║' + ' '.repeat(width) + '║');
    console.log(bottomLine);
    console.log('');
  }

  // Helper: Center text in a line
  centerText(text, width) {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
  }

  // Helper: Format key-value line
  formatLine(key, value, width, bold = false) {
    const valueStr = bold ? `>>> ${value} <<<` : value;
    const totalLength = key.length + valueStr.length + 2;
    const dots = '.'.repeat(Math.max(1, width - totalLength - 4));
    return `  ${key} ${dots} ${valueStr}  `;
  }
}

module.exports = new DSRModel();
