const DailyResponse = require('../models/dailyResponseModel');

class DailyResponseController {
  // Get all daily responses
  async getAllResponses(req, res) {
    try {
      const responses = await DailyResponse.find().sort({ date: -1 });
      res.json({
        success: true,
        count: responses.length,
        responses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to fetch responses: ${error.message}`
      });
    }
  }

  // Get response by date
  async getResponseByDate(req, res) {
    try {
      const { date } = req.params;
      const responses = await DailyResponse.find({ dateString: date });
      
      if (!responses || responses.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No responses found for date: ${date}`
        });
      }
      
      res.json({
        success: true,
        count: responses.length,
        responses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to fetch response: ${error.message}`
      });
    }
  }

  // Get responses within date range
  async getResponsesByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const query = {};
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      const responses = await DailyResponse.find(query).sort({ date: -1 });
      
      res.json({
        success: true,
        count: responses.length,
        responses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to fetch responses: ${error.message}`
      });
    }
  }

  // Save a new daily response
  async saveResponse(req, res) {
    try {
      const { analysisData, dateString, modelUsed, responseTime } = req.body;
      
      if (!analysisData) {
        return res.status(400).json({
          success: false,
          error: 'Analysis data is required'
        });
      }
      
      // Create date string if not provided
      const date = new Date();
      const finalDateString = dateString || date.toISOString().split('T')[0];
      
      const newResponse = new DailyResponse({
        date: date,
        dateString: finalDateString,
        analysisData: analysisData,
        analysisSummary: analysisData.analysisSummary || {},
        modelUsed: modelUsed || 'anthropic/claude-3-haiku',
        responseTime: responseTime || 0
      });
      
      await newResponse.save();
      
      console.log(`✅ Saved daily response for ${finalDateString}`);
      
      res.status(201).json({
        success: true,
        message: 'Daily response saved successfully',
        response: newResponse
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to save response: ${error.message}`
      });
    }
  }

  // Delete a response
  async deleteResponse(req, res) {
    try {
      const { id } = req.params;
      const response = await DailyResponse.findByIdAndDelete(id);
      
      if (!response) {
        return res.status(404).json({
          success: false,
          error: `Response not found`
        });
      }
      
      res.json({
        success: true,
        message: 'Response deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to delete response: ${error.message}`
      });
    }
  }

  // Get latest response
  async getLatestResponse(req, res) {
    try {
      const response = await DailyResponse.findOne().sort({ date: -1 });
      
      if (!response) {
        return res.status(404).json({
          success: false,
          error: 'No responses found'
        });
      }
      
      res.json({
        success: true,
        response
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to fetch latest response: ${error.message}`
      });
    }
  }
}

module.exports = new DailyResponseController();

