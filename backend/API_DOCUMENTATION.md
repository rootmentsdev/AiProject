# 📚 DSR Analysis API Documentation

Complete API reference for the DSR Analysis Backend System.

## Base URL
```
http://localhost:5000/api
```

---

## 📊 DSR Analysis Endpoints

### Analyze DSR Sheet
Fetches data from Google Sheet and analyzes it with AI. Automatically saves response to MongoDB.

**Endpoint:** `GET /api/analyze-sheet`

**Response:**
```json
{
  "analysisSummary": {
    "totalStores": "12",
    "badPerformingStores": "3",
    "analysisPeriod": "December 2025",
    "keyFindings": "..."
  },
  "badPerformingStores": [
    {
      "storeName": "Store Name",
      "conversionRate": "45%",
      "billsPerformance": "60%",
      "whyBadPerforming": "...",
      "suggestedActions": "..."
    }
  ],
  "summaryTable": [...]
}
```

---

## 📝 Prompt Management Endpoints

### Get All Prompts
**Endpoint:** `GET /api/prompts`

**Response:**
```json
{
  "success": true,
  "count": 1,
  "prompts": [
    {
      "_id": "...",
      "name": "DSR_ANALYSIS_PROMPT",
      "promptText": "...",
      "description": "...",
      "category": "DSR_ANALYSIS",
      "version": "1.0",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### Get Prompt by Name
**Endpoint:** `GET /api/prompts/:name`

**Example:** `GET /api/prompts/DSR_ANALYSIS_PROMPT`

### Create New Prompt
**Endpoint:** `POST /api/prompts`

**Body:**
```json
{
  "name": "NEW_PROMPT",
  "promptText": "Your prompt text...",
  "description": "Description",
  "category": "CUSTOM",
  "version": "1.0"
}
```

### Update Prompt
**Endpoint:** `PUT /api/prompts/:name`

**Body:**
```json
{
  "promptText": "Updated text...",
  "version": "1.1",
  "description": "Updated description"
}
```

### Delete Prompt
**Endpoint:** `DELETE /api/prompts/:name`

---

## 📅 Daily Response Management Endpoints

### Get All Daily Responses
**Endpoint:** `GET /api/daily-responses`

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
        "badPerformingStores": "3"
      },
      "modelUsed": "anthropic/claude-3-haiku",
      "responseTime": 2450,
      "createdAt": "..."
    }
  ]
}
```

### Get Latest Response
**Endpoint:** `GET /api/daily-responses/latest`

Returns the most recent analysis response.

### Get Responses by Date
**Endpoint:** `GET /api/daily-responses/:date`

**Example:** `GET /api/daily-responses/2025-10-21`

Returns all responses from the specified date (YYYY-MM-DD format).

### Get Responses by Date Range
**Endpoint:** `GET /api/daily-responses/range`

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD) - optional
- `endDate`: End date (YYYY-MM-DD) - optional

**Example:** `GET /api/daily-responses/range?startDate=2025-10-01&endDate=2025-10-21`

### Save Response (Manual)
**Endpoint:** `POST /api/daily-responses`

**Body:**
```json
{
  "analysisData": { /* Your analysis data */ },
  "dateString": "2025-10-21",
  "modelUsed": "anthropic/claude-3-haiku",
  "responseTime": 2450
}
```

**Note:** Responses are automatically saved when using `/api/analyze-sheet`, so this endpoint is optional.

### Delete Response
**Endpoint:** `DELETE /api/daily-responses/:id`

**Example:** `DELETE /api/daily-responses/671ab123def456789`

---

## 🔧 CORS Configuration

The server is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)

Allowed methods:
- GET
- POST
- PUT
- DELETE

---

## 🔐 Environment Variables

```javascript
OPENROUTER_API_KEY = 'sk-or-v1-...'
MONGODB_URI = 'mongodb+srv://abhiramskumar75_db_user:root@cluster0.bg40zfa.mongodb.net/...'
```

---

## 📦 Complete API Summary

| Method | Endpoint | Description | Auto-saves to DB |
|--------|----------|-------------|------------------|
| GET | `/api/analyze-sheet` | Analyze DSR data | ✅ Yes |
| GET | `/api/prompts` | Get all prompts | ❌ No |
| GET | `/api/prompts/:name` | Get specific prompt | ❌ No |
| POST | `/api/prompts` | Create new prompt | ❌ No |
| PUT | `/api/prompts/:name` | Update prompt | ❌ No |
| DELETE | `/api/prompts/:name` | Delete prompt | ❌ No |
| GET | `/api/daily-responses` | Get all responses | ❌ No |
| GET | `/api/daily-responses/latest` | Get latest response | ❌ No |
| GET | `/api/daily-responses/:date` | Get responses by date | ❌ No |
| GET | `/api/daily-responses/range` | Get responses by range | ❌ No |
| POST | `/api/daily-responses` | Save response manually | ❌ No |
| DELETE | `/api/daily-responses/:id` | Delete response | ❌ No |

---

## 🚀 Quick Start Examples

### JavaScript/Fetch
```javascript
// Analyze DSR Sheet (auto-saves to MongoDB)
const response = await fetch('http://localhost:5000/api/analyze-sheet');
const data = await response.json();

// Get all historical responses
const history = await fetch('http://localhost:5000/api/daily-responses');
const allResponses = await history.json();

// Get today's analysis
const today = new Date().toISOString().split('T')[0];
const todayData = await fetch(`http://localhost:5000/api/daily-responses/${today}`);
const todayAnalysis = await todayData.json();

// Get all prompts
const prompts = await fetch('http://localhost:5000/api/prompts');
const promptList = await prompts.json();
```

### cURL
```bash
# Analyze DSR Sheet
curl http://localhost:5000/api/analyze-sheet

# Get all daily responses
curl http://localhost:5000/api/daily-responses

# Get responses by date
curl http://localhost:5000/api/daily-responses/2025-10-21

# Get all prompts
curl http://localhost:5000/api/prompts

# Create new prompt
curl -X POST http://localhost:5000/api/prompts \
  -H "Content-Type: application/json" \
  -d '{"name":"TEST_PROMPT","promptText":"Test prompt text"}'
```

---

## 📊 Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## 🎯 Data Flow

```
Frontend Request
    ↓
Express Server (server.js)
    ↓
Routes (dsrRoutes.js / promptRoutes.js / dailyResponseRoutes.js)
    ↓
Controllers (dsrController.js / promptController.js / dailyResponseController.js)
    ↓
Models (dsrModel.js / promptModel.js / dailyResponseModel.js)
    ↓
MongoDB Atlas / OpenRouter AI
    ↓
Response Back to Frontend
```

---

**Complete API Reference v1.0** 📚

