const mongoose = require('mongoose');

const dailyResponseSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  dateString: {
    type: String,
    required: true
  },
  analysisData: {
    type: Object,
    required: true
  },
  analysisSummary: {
    totalStores: String,
    badPerformingStores: String,
    analysisPeriod: String,
    keyFindings: String
  },
  modelUsed: {
    type: String,
    default: 'anthropic/claude-3-haiku'
  },
  responseTime: {
    type: Number,
    default: 0
  },
  promptUsed: {
    type: String,
    default: 'DSR_ANALYSIS_PROMPT'
  },
  tokenUsage: {
    dsrAnalysis: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 }
    },
    actionPlans: [{
      storeName: String,
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 }
    }],
    totalPromptTokens: { type: Number, default: 0 },
    totalCompletionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index on date for faster queries
dailyResponseSchema.index({ date: -1 });
dailyResponseSchema.index({ dateString: 1 });

const DailyResponse = mongoose.model('DailyResponse', dailyResponseSchema);

module.exports = DailyResponse;

