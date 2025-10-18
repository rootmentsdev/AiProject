# DSR Analysis Backend Setup Instructions

## Required Environment Variables

You need to create a `.env` file in the backend directory with your OpenRouter API key.

### Steps:

1. **Create `.env` file** in the `backend` directory
2. **Add your OpenRouter API key** to the file:

```
OPENROUTER_API_KEY=your_actual_api_key_here
```

3. **Get your API key** from: https://openrouter.ai/keys
4. **Save the file** as `.env` (not `.env.txt`)
5. **Restart the backend server**

### Example .env file content:
```
OPENROUTER_API_KEY=sk-or-v1-abc123def456...
```

### Testing:
- Run `node server.js` in the backend directory
- The server should show: "✅ API Key length: XX characters"
- If you see "❌ OPENROUTER_API_KEY is missing", check your .env file

### Troubleshooting:
- Make sure the .env file is in the backend directory (same level as server.js)
- Make sure there are no spaces around the = sign
- Make sure the API key starts with "sk-or-v1-"
- Restart the server after creating/updating the .env file
