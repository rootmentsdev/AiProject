const dsrModel = require('../models/dsrModel');
const DailyResponse = require('../models/dailyResponseModel');

class DSRController {
  async analyzeSheet(req, res) {
    try {
      console.log("🔗 Analyzing Suitor Guy Kerala DSR Sheet...");
      
      const startTime = Date.now();
      
      // Fetch data from hardcoded Google Sheet
      const dsrData = await dsrModel.fetchSheetData();
      
      if (!dsrData || dsrData.trim() === '') {
        console.error("❌ No valid data found in sheet");
        return res.status(400).json({ error: "No valid data found in the Google Sheet. Please check the sheet content." });
      }

      console.log("📊 DSR Data Preview:", dsrData.substring(0, 500) + "...");
      
      // Analyze DSR data with AI
      const result = await dsrModel.analyzeWithAI(dsrData);
      
      const responseTime = Date.now() - startTime;
      
      // Save the response to MongoDB
      try {
        const date = new Date();
        const dateString = date.toISOString().split('T')[0];
        
        const dailyResponse = new DailyResponse({
          date: date,
          dateString: dateString,
          analysisData: result,
          analysisSummary: result.analysisSummary || {},
          modelUsed: dsrModel.lastUsedModel || 'anthropic/claude-3-haiku',
          responseTime: responseTime
        });
        
        await dailyResponse.save();
        console.log(`✅ Saved daily response to MongoDB (${dateString})`);
      } catch (saveError) {
        console.error("❌ Failed to save response to MongoDB:", saveError.message);
        // Continue even if save fails - don't block the response
      }
      
      res.json(result);
      
    } catch (err) {
      console.error("❌ DSR Sheet Analysis Failed:", err.message);
      console.error("❌ Error details:", err.response?.data || err.stack);
      
      if (err.response?.status === 403) {
        return res.status(400).json({ error: "Access denied. Please ensure the Google Sheet is publicly accessible (Anyone with the link can view)." });
      } else if (err.response?.status === 404) {
        return res.status(400).json({ error: "Google Sheet not found. Please check the URL." });
      } else if (err.code === 'ECONNABORTED') {
        return res.status(500).json({ error: "Request timeout. The sheet might be too large or slow to access." });
      }
      
      res.status(500).json({ error: `Failed to analyze DSR sheet: ${err.message}` });
    }
  }
}

module.exports = new DSRController();
