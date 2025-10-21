# 📝 Prompt Management System

## Overview
The DSR Analysis application now automatically saves prompts to MongoDB. The prompt used for analyzing DSR data is stored in the database and can be managed through API endpoints.

## 🚀 Features

- ✅ **Auto-save on startup**: The DSR analysis prompt is automatically saved to MongoDB when the server starts
- ✅ **Version control**: Track prompt versions and update history
- ✅ **CRUD operations**: Full Create, Read, Update, Delete support for prompts
- ✅ **MongoDB integration**: All prompts stored securely in MongoDB Atlas

## 📊 Database Schema

```javascript
{
  name: String (unique),          // Prompt identifier (e.g., 'DSR_ANALYSIS_PROMPT')
  promptText: String,             // The actual prompt text
  description: String,            // Description of what the prompt does
  category: String,               // Category (e.g., 'DSR_ANALYSIS')
  version: String,                // Version number
  createdAt: Date,                // Creation timestamp
  updatedAt: Date                 // Last update timestamp
}
```

## 🔌 API Endpoints

### 1. Get All Prompts
```
GET http://localhost:5000/api/prompts
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "prompts": [
    {
      "_id": "...",
      "name": "DSR_ANALYSIS_PROMPT",
      "promptText": "# Bad Performing Stores Analysis...",
      "description": "Prompt for analyzing DSR data",
      "category": "DSR_ANALYSIS",
      "version": "1.0",
      "createdAt": "2025-10-21T...",
      "updatedAt": "2025-10-21T..."
    }
  ]
}
```

### 2. Get Specific Prompt by Name
```
GET http://localhost:5000/api/prompts/DSR_ANALYSIS_PROMPT
```

### 3. Create New Prompt
```
POST http://localhost:5000/api/prompts
Content-Type: application/json

{
  "name": "NEW_PROMPT",
  "promptText": "Your prompt text here...",
  "description": "Description of the prompt",
  "category": "CUSTOM",
  "version": "1.0"
}
```

### 4. Update Existing Prompt
```
PUT http://localhost:5000/api/prompts/DSR_ANALYSIS_PROMPT
Content-Type: application/json

{
  "promptText": "Updated prompt text...",
  "version": "1.1",
  "description": "Updated description"
}
```

### 5. Delete Prompt
```
DELETE http://localhost:5000/api/prompts/PROMPT_NAME
```

## 🔧 How It Works

1. **Server Startup**: When `server.js` starts, it connects to MongoDB
2. **Auto-save**: The `savePromptOnStartup()` function is called
3. **Check Existing**: Checks if 'DSR_ANALYSIS_PROMPT' already exists in database
4. **Save/Update**: If not exists, creates new. If exists, updates with latest version
5. **Logging**: Displays confirmation and prompt details in console

## 📝 Files Created

```
backend/
├── models/
│   └── promptModel.js          # Mongoose schema for prompts
├── controllers/
│   └── promptController.js     # CRUD operations for prompts
├── routes/
│   └── promptRoutes.js        # API routes for prompt management
└── utils/
    └── savePrompt.js          # Auto-save function for startup
```

## 🎯 Usage Example

After starting the server, you'll see:

```
✅ MongoDB connected successfully
✅ DSR Analysis Prompt saved to MongoDB
📝 Prompt Details:
   - Name: DSR_ANALYSIS_PROMPT
   - Category: DSR_ANALYSIS
   - Version: 1.0
   - Length: 2450 characters
   - Last Updated: 2025-10-21T...
```

## 🔐 MongoDB Connection

The connection string is configured in `server.js`:
```javascript
const MONGODB_URI = 'mongodb+srv://abhiramskumar75_db_user:root@cluster0.bg40zfa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
```

## 📌 Notes

- The prompt is automatically saved/updated every time the server restarts
- You can manage prompts programmatically using the API endpoints
- All prompts include timestamps for tracking changes
- The original prompt template is in `config/dsrPrompts.js`

## 🚀 Next Steps

You can now:
1. View all saved prompts via API
2. Create custom prompts for different analysis types
3. Update prompts without changing code
4. Track prompt versions and changes
5. Build a frontend UI to manage prompts

---

**Happy Prompting! 🎉**

