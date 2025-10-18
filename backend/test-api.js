require('dotenv').config();

const axios = require('axios');

async function testOpenRouterAPI() {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
  
  console.log("🔑 API Key check:", OPENROUTER_API_KEY ? "Found" : "Missing");
  console.log("🔑 API Key length:", OPENROUTER_API_KEY?.length || 0);
  console.log("🔑 API Key preview:", OPENROUTER_API_KEY?.slice(0, 10) + "...");
  
  if (!OPENROUTER_API_KEY) {
    console.error("❌ No API key found");
    return;
  }

  try {
    console.log("🧪 Testing OpenRouter API...");
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: [
        { role: "user", content: "Hello, respond with 'API test successful'" }
      ],
      max_tokens: 50,
      temperature: 0.1
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'API Test'
      },
      timeout: 10000
    });

    console.log("✅ API Response:", response.data.choices[0].message.content);
    
  } catch (error) {
    console.error("❌ API Test Failed:");
    console.error("❌ Error message:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Response status:", error.response?.status);
    console.error("❌ Response data:", error.response?.data);
  }
}

testOpenRouterAPI();
