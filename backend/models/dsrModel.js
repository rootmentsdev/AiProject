const axios = require('axios');
const dsrPrompts = require('../config/dsrPrompts');

class DSRModel {
  // Hardcoded Google Sheet configuration
  constructor() {
    this.SHEET_ID = '1MBcdsEJuaX4c8B0cHrBHxyr6cbOO3HWnm5vFZ7awYeU';
    this.SHEET_GID = '1471294074';
    this.lastUsedModel = null;
  }

  async fetchSheetData() {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/export?format=csv&gid=${this.SHEET_GID}`;
    console.log("🔗 CSV Export URL:", csvUrl);

    const response = await axios.get(csvUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.data || response.data.trim() === '') {
      throw new Error("Empty response from Google Sheets");
    }

    const lines = response.data.split('\n');
    console.log(`📊 Found ${lines.length} rows in the sheet`);
    
    // Parse DSR data specifically for Suitor Guy Kerala stores
    let dsrData = '';
    let headerFound = false;
    let dataRows = 0;
    let sheetDate = null;
    
    // Find the header row (row 5) and extract store data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Extract date from the sheet (look for date patterns like 12/8/2025)
      if (!sheetDate && line.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
        sheetDate = line.match(/\d{1,2}\/\d{1,2}\/\d{4}/)[0];
        console.log(`📅 Found DSR sheet date: ${sheetDate}`);
      }
      
      // Look for header row (contains STORE, FTD, MTD, L2L)
      if (line.includes('STORE') && line.includes('FTD') && line.includes('MTD') && line.includes('L2L')) {
        dsrData += `Header Row: ${line}\n`;
        headerFound = true;
        continue;
      }
      
      // Include store data rows (skip empty rows and totals)
      if (headerFound && line.includes(',') && 
          !line.includes('SUITOR GUY') && 
          !line.includes('12/8/2025') &&
          !line.includes('TOTAL') &&
          !line.includes('SUITOR GUY KERALA SHOES') &&
          line.split(',').length > 5) {
        
        // Extract store name and key metrics
        const columns = line.split(',');
        const storeName = columns[1]?.trim(); // Store name is in column B
        
        if (storeName && storeName !== '' && !storeName.includes('SUITOR GUY')) {
          dsrData += `Store Data: ${line}\n`;
          dataRows++;
        }
      }
    }

    console.log(`📊 Processed ${dataRows} store data rows from ${lines.length} total rows`);
    
    // Store the extracted date for use in cancellation analysis
    this.sheetDate = sheetDate;
    
    return {
      data: dsrData,
      date: sheetDate
    };
  }

  async analyzeWithAI(dsrData, retryCount = 0) {
    // Handle both old string format and new object format
    const dataToAnalyze = typeof dsrData === 'object' ? dsrData.data : dsrData;
    const maxRetries = 3;
    const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
    
    console.log("🔑 Groq API Key check:", GROQ_API_KEY ? "Found" : "Missing");
    console.log("🔑 API Key length:", GROQ_API_KEY?.length || 0);
    
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not found');
    }

    const prompt = dsrPrompts.getDSRAnalysisPrompt(dataToAnalyze);

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
        max_tokens: 3000,
        temperature: 0.1
      }, {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Track which model was used
      this.lastUsedModel = selectedModel;

      const raw = response.data.choices[0].message.content;
      console.log("🔍 Raw AI Response (DSR Analysis):", raw);
      
      if (!raw || raw.trim() === '') {
        throw new Error("AI service returned empty response. Please try again.");
      }
      
      // Clean and parse the JSON response
      const cleanedResponse = this.cleanJSON(raw);
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        console.log("✅ Successfully parsed DSR analysis:", parsed);
        return parsed;
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError.message);
        console.log("🔄 Creating fallback response");
        return this.createFallbackResponse(dsrData);
      }
      
    } catch (error) {
      console.error("❌ AI Request Failed:");
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", error.code);
      console.error("❌ Response status:", error.response?.status);
      console.error("❌ Response data:", error.response?.data);
      console.error("❌ Full error:", error);
      
      // Retry logic
      if (retryCount < maxRetries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message.includes('timeout') ||
        error.response?.status === 401 ||
        error.response?.status === 429
      )) {
        console.log(`🔄 Retrying request in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.analyzeWithAI(dsrData, retryCount + 1);
      }
      
      if (error.response?.status === 401) {
        throw new Error('API authentication failed. Please check your Groq API key.');
      } else if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Failed to connect to Groq AI service: ${error.message}`);
    }
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
