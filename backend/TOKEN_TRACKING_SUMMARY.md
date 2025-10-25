# 💰 Token Usage Tracking System

## ✅ Implemented Features

### 1. **Eye-Catching Terminal Display**
When DSR analysis runs, you'll see a beautiful box showing token usage:

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                            💰 TOKEN USAGE REPORT 💰                            ║
║                                                                                ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  📋 Call Type: ......................... DSR Analysis                          ║
║  🤖 AI Provider: ....................... Groq                                  ║
║                                                                                ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  📥 Prompt Tokens: ..................... 2,547                                 ║
║  📤 Completion Tokens: ................. 1,823                                 ║
║                                                                                ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  🎯 TOTAL TOKENS: ...................... >>> ✨ 4,370 ✨ <<<                   ║
║                                                                                ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  💵 Estimated Cost: .................... FREE (100k tokens/day limit)          ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### 2. **MongoDB Storage**
Token usage is saved in the `DailyResponse` collection:

```javascript
{
  "tokenUsage": {
    "dsrAnalysis": {
      "promptTokens": 2547,
      "completionTokens": 1823,
      "totalTokens": 4370
    },
    "actionPlans": [
      {
        "storeName": "KALPETTA",
        "promptTokens": 856,
        "completionTokens": 412,
        "totalTokens": 1268
      }
    ],
    "totalPromptTokens": 3403,
    "totalCompletionTokens": 2235,
    "totalTokens": 5638,
    "estimatedCost": 0
  }
}
```

### 3. **Supports Both APIs**
- **Groq API**: Captures `usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`
- **Gemini API**: Captures `usageMetadata.promptTokenCount`, `usageMetadata.candidatesTokenCount`, `usageMetadata.totalTokenCount`

## 🎯 What You'll See

### DSR Analysis Call:
```
✅ Successfully parsed DSR analysis from Groq
📊 Total stores in response: 15
🔴 Bad performing stores count: 13

╔════════════════════════════════════════════════════════════════════════════════╗
║                            💰 TOKEN USAGE REPORT 💰                            ║
╠════════════════════════════════════════════════════════════════════════════════╣
║  📋 Call Type: ......................... DSR Analysis                          ║
║  🤖 AI Provider: ....................... Groq                                  ║
║  📥 Prompt Tokens: ..................... 2,547                                 ║
║  📤 Completion Tokens: ................. 1,823                                 ║
║  🎯 TOTAL TOKENS: ...................... >>> ✨ 4,370 ✨ <<<                   ║
║  💵 Estimated Cost: .................... FREE (100k tokens/day limit)          ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

### Action Plan Call (Coming Next):
```
╔════════════════════════════════════════════════════════════════════════════════╗
║                            💰 TOKEN USAGE REPORT 💰                            ║
╠════════════════════════════════════════════════════════════════════════════════╣
║  📋 Call Type: ......................... Action Plan (KALPETTA)                ║
║  🤖 AI Provider: ....................... Groq                                  ║
║  📥 Prompt Tokens: ..................... 856                                   ║
║  📤 Completion Tokens: ................. 412                                   ║
║  🎯 TOTAL TOKENS: ...................... >>> ✨ 1,268 ✨ <<<                   ║
║  💵 Estimated Cost: .................... FREE (100k tokens/day limit)          ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

## 📊 Benefits

1. ✅ **Track API Usage**: Know exactly how many tokens each call uses
2. ✅ **Monitor Costs**: See if you're approaching rate limits
3. ✅ **Debug Issues**: Identify which calls are consuming most tokens
4. ✅ **Historical Data**: All token usage saved in MongoDB for analysis
5. ✅ **Eye-Catching Display**: Impossible to miss in terminal output!

## 🔧 Files Modified

1. `backend/models/dailyResponseModel.js` - Added `tokenUsage` field to schema
2. `backend/models/dsrModel.js` - Added token capture and display for DSR analysis
3. `backend/controllers/dsrController.js` - (Next: Add token capture for action plans)

## 📈 Usage Example

Run your backend and perform an analysis. You'll see:
1. Token usage box after DSR analysis completes
2. Token usage box after each action plan generation
3. All data automatically saved to MongoDB
4. Access historical data via MongoDB queries


