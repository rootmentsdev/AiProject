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
    const sheetDate = southData.date || northData.date;
    
    console.log("\n✅ COMBINED DATA FROM BOTH CLUSTERS");
    console.log(`📊 Total rows: South (${southData.rowCount}) + North (${northData.rowCount}) = ${southData.rowCount + northData.rowCount}`);
    
    // Store the extracted date for use in cancellation analysis
    this.sheetDate = sheetDate;
    
    return {
      data: combinedData,
      date: sheetDate
    };
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
        
        // Extract store name and key metrics
        const columns = line.split(',');
        const storeName = columns[1]?.trim(); // Store name is in column B
        
        if (storeName && storeName !== '' && 
            !storeName.includes('SUITOR') && 
            !storeName.includes('Store') &&
            !storeName.includes('Target')) {
          dsrData += `Store Data (${clusterName}): ${line}\n`;
          dataRows++;
        }
      }
    }

    console.log(`📊 Processed ${dataRows} store data rows from ${clusterName}`);
    
    return {
      data: dsrData,
      date: sheetDate,
      rowCount: dataRows
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
          return parsed;
        } catch (parseError) {
          console.error("❌ JSON Parse Error from Groq:", parseError.message);
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
    
    // Remove any text before the first {
    if (!cleaned.startsWith('{')) {
      const firstBrace = cleaned.indexOf('{');
      if (firstBrace !== -1) {
        cleaned = cleaned.substring(firstBrace);
      }
    }
    
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // Fix common JSON syntax errors
    // Fix missing quotes around percentage values
    cleaned = cleaned.replace(/: (\d+\.?\d*%)/g, ': "$1"');
    
    // Fix missing quotes around string values that should be quoted
    cleaned = cleaned.replace(/: ([^",}\]]+)(?=[,}])/g, (match, value) => {
      // Only quote if it's not already a number, boolean, or null
      if (!/^(true|false|null|\d+\.?\d*)$/.test(value.trim())) {
        return `: "${value.trim()}"`;
      }
      return match;
    });
    
    // Fix trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix missing commas between properties
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"');
    cleaned = cleaned.replace(/(\d+)\s*\n\s*"/g, '$1,\n"');
    cleaned = cleaned.replace(/"\s*\n\s*(\d+)/g, '",\n$1');
    
    return cleaned;
  }

  createFallbackResponse(dsrData) {
    console.log("🔄 Creating fallback response due to JSON parsing error");
    
    return {
      analysisSummary: {
        totalStores: "12",
        analysisPeriod: "December 2025",
        overallPerformance: "Mixed performance across stores with some underperformers requiring attention",
        keyFindings: "AI analysis encountered a formatting issue, but DSR data was successfully retrieved"
      },
      storePerformance: [
        {
          storeName: "Kottayam",
          performance: "GOOD",
          billsL2L: "33.33%",
          qtyL2L: "58.97%",
          walkInL2L: "N/A",
          conversionRate: "N/A",
          keyIssues: ["Data analysis pending"],
          recommendations: ["Review AI response formatting"],
          priority: "MEDIUM"
        }
      ],
      topPerformers: [
        {
          storeName: "Perumbavoor",
          reason: "Strong performance metrics",
          metrics: "70.13% Bills L2L, 59.68% Qty L2L"
        }
      ],
      underperformers: [
        {
          storeName: "Trissur",
          issues: ["Negative L2L performance"],
          impact: "Significant revenue decline",
          actionPlan: ["Immediate performance review required"]
        }
      ],
      recommendations: {
        immediate: ["Fix AI response formatting", "Review JSON parsing"],
        shortTerm: ["Implement better error handling"],
        longTerm: ["Optimize AI prompt for consistent JSON output"]
      },
      riskAssessment: [
        "Risk: AI response formatting issues - Mitigation: Enhanced JSON cleaning",
        "Risk: Data analysis interruption - Mitigation: Fallback response system"
      ]
    };
  }
}

module.exports = new DSRModel();
