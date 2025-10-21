# 📅 Daily Response Management System

## Overview
The DSR Analysis application automatically saves all AI analysis responses to MongoDB with timestamps. This allows you to track historical analysis, compare performance over time, and retrieve past reports.

## 🚀 Features

- ✅ **Auto-save on analysis**: Every DSR analysis is automatically saved to MongoDB
- ✅ **Date tracking**: Responses are saved with full date and time information
- ✅ **Model tracking**: Records which AI model was used for the analysis
- ✅ **Response time tracking**: Measures and saves how long the analysis took
- ✅ **Full CRUD operations**: Complete API for managing historical responses
- ✅ **Date range queries**: Query responses by date or date range

## 📊 Database Schema

```javascript
{
  date: Date,                     // Full timestamp of when response was saved
  dateString: String,             // Date in YYYY-MM-DD format for easy querying
  analysisData: Object,           // Complete AI analysis response
  analysisSummary: {              // Quick summary extracted from analysis
    totalStores: String,
    badPerformingStores: String,
    analysisPeriod: String,
    keyFindings: String
  },
  modelUsed: String,              // AI model used (e.g., 'anthropic/claude-3-haiku')
  responseTime: Number,           // How long the analysis took (in milliseconds)
  promptUsed: String,             // Which prompt was used
  createdAt: Date                 // MongoDB timestamp
}
```

## 🔄 How It Works

### Automatic Save on Analysis

When you call the DSR analysis endpoint:
1. **Analysis starts**: Timer begins
2. **Fetch data**: Google Sheet data is retrieved
3. **AI analysis**: Data is sent to AI for analysis
4. **Calculate time**: Response time is calculated
5. **Auto-save**: Response is automatically saved to MongoDB with date
6. **Return response**: Original analysis is returned to frontend

### No Extra Steps Required!

The system automatically saves every analysis response. You don't need to do anything extra - just analyze and it's saved!

## 🔌 API Endpoints

### 1. Get All Daily Responses
```
GET http://localhost:5000/api/daily-responses
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "responses": [
    {
      "_id": "...",
      "date": "2025-10-21T10:30:00.000Z",
      "dateString": "2025-10-21",
      "analysisData": { /* Full analysis */ },
      "analysisSummary": {
        "totalStores": "12",
        "badPerformingStores": "3",
        "analysisPeriod": "December 2025"
      },
      "modelUsed": "anthropic/claude-3-haiku",
      "responseTime": 2450
    }
  ]
}
```

### 2. Get Latest Response
```
GET http://localhost:5000/api/daily-responses/latest
```

Returns the most recent analysis response.

### 3. Get Responses by Date
```
GET http://localhost:5000/api/daily-responses/2025-10-21
```

Returns all responses from a specific date (YYYY-MM-DD format).

### 4. Get Responses by Date Range
```
GET http://localhost:5000/api/daily-responses/range?startDate=2025-10-01&endDate=2025-10-21
```

Query parameters:
- `startDate`: Start date (YYYY-MM-DD) - optional
- `endDate`: End date (YYYY-MM-DD) - optional

### 5. Manually Save Response (Optional)
```
POST http://localhost:5000/api/daily-responses
Content-Type: application/json

{
  "analysisData": { /* Your analysis data */ },
  "dateString": "2025-10-21",
  "modelUsed": "anthropic/claude-3-haiku",
  "responseTime": 2450
}
```

**Note**: This is optional since responses are auto-saved during analysis.

### 6. Delete Response
```
DELETE http://localhost:5000/api/daily-responses/[response_id]
```

## 📝 Frontend Integration

### Analyzing DSR Sheet (Auto-saves to MongoDB)
```javascript
// Simply call the analysis endpoint - saving happens automatically!
const response = await fetch('http://localhost:5000/api/analyze-sheet');
const data = await response.json();

// The response is already saved to MongoDB with today's date
console.log('Analysis complete and saved:', data);
```

### Retrieving Historical Data
```javascript
// Get all historical responses
const history = await fetch('http://localhost:5000/api/daily-responses');
const allResponses = await history.json();

// Get today's responses
const today = new Date().toISOString().split('T')[0];
const todayData = await fetch(`http://localhost:5000/api/daily-responses/${today}`);

// Get latest response
const latest = await fetch('http://localhost:5000/api/daily-responses/latest');

// Get responses from last 7 days
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];
const weekData = await fetch(
  `http://localhost:5000/api/daily-responses/range?startDate=${sevenDaysAgo}&endDate=${today}`
);
```

## 🎯 Use Cases

### 1. Historical Trend Analysis
Track store performance over time by comparing daily responses:
```javascript
// Compare this week vs last week
const thisWeek = await getResponsesByDateRange('2025-10-14', '2025-10-21');
const lastWeek = await getResponsesByDateRange('2025-10-07', '2025-10-14');
```

### 2. Performance Monitoring
Monitor which stores consistently appear as bad performers:
```javascript
const last30Days = await getResponsesByDateRange(thirtyDaysAgo, today);
const storePerformance = analyzeStoreFrequency(last30Days);
```

### 3. Model Performance Tracking
See which AI models provide better analysis:
```javascript
const responses = await getAllResponses();
const modelStats = groupByModel(responses);
// Compare response times and quality
```

### 4. Daily Reports Dashboard
Build a dashboard showing daily analysis history:
```javascript
// Get all responses and display in a calendar view
const allResponses = await getAllResponses();
renderCalendar(allResponses);
```

## 📂 Files Created

```
backend/
├── models/
│   └── dailyResponseModel.js        # Mongoose schema for daily responses
├── controllers/
│   ├── dsrController.js             # Updated to auto-save responses
│   └── dailyResponseController.js   # CRUD operations for responses
└── routes/
    └── dailyResponseRoutes.js       # API routes for response management
```

## 🔍 Example Response Structure

```json
{
  "_id": "671ab123def456789",
  "date": "2025-10-21T10:30:45.123Z",
  "dateString": "2025-10-21",
  "analysisData": {
    "analysisSummary": {
      "totalStores": "12",
      "badPerformingStores": "3",
      "analysisPeriod": "December 2025",
      "keyFindings": "3 stores need immediate attention..."
    },
    "badPerformingStores": [
      {
        "storeName": "Trissur",
        "conversionRate": "45%",
        "whyBadPerforming": "Low conversion rate...",
        "suggestedActions": "Focus on customer engagement..."
      }
    ]
  },
  "analysisSummary": {
    "totalStores": "12",
    "badPerformingStores": "3",
    "analysisPeriod": "December 2025",
    "keyFindings": "3 stores need immediate attention..."
  },
  "modelUsed": "anthropic/claude-3-haiku",
  "responseTime": 2450,
  "promptUsed": "DSR_ANALYSIS_PROMPT",
  "createdAt": "2025-10-21T10:30:45.123Z"
}
```

## 🔐 MongoDB Connection

Uses the same MongoDB connection configured in `server.js`.

## 📊 Query Examples

### Get all responses from October 2025
```javascript
const responses = await fetch(
  'http://localhost:5000/api/daily-responses/range?startDate=2025-10-01&endDate=2025-10-31'
);
```

### Find responses that took longer than 3 seconds
```javascript
const allResponses = await fetch('http://localhost:5000/api/daily-responses');
const data = await allResponses.json();
const slowResponses = data.responses.filter(r => r.responseTime > 3000);
```

### Compare weekend vs weekday performance
```javascript
const allResponses = await getAllResponses();
const weekend = allResponses.filter(r => {
  const day = new Date(r.date).getDay();
  return day === 0 || day === 6;
});
const weekday = allResponses.filter(r => {
  const day = new Date(r.date).getDay();
  return day > 0 && day < 6;
});
```

## 📝 Console Output

When a response is saved, you'll see:
```
✅ Saved daily response to MongoDB (2025-10-21)
```

If saving fails (MongoDB connection issue):
```
❌ Failed to save response to MongoDB: [error message]
```

**Note**: Even if saving fails, the analysis response is still returned to the frontend. Saving failures don't block the main analysis.

## 🎉 Benefits

1. **Historical tracking**: Never lose analysis data
2. **Trend analysis**: Compare performance over time
3. **Audit trail**: Know exactly when each analysis was run
4. **Performance metrics**: Track AI model performance and response times
5. **Easy retrieval**: Query by date, date range, or get latest
6. **Automatic**: No extra code needed - just analyze and it's saved!

---

**Every analysis is automatically preserved! 📅✨**

