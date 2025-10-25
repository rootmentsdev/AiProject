# 🆓 Google Gemini API Setup Guide (FREE!)

## 🎯 What You Get

- ✅ **1,500 requests per day** (FREE)
- ✅ **1,500,000 tokens per day** (15x more than Groq!)
- ✅ **Fast response times** (4-6 seconds)
- ✅ **High-quality AI** (Gemini 1.5 Flash)
- ✅ **No credit card required**

---

## 📋 Step-by-Step Guide

### **Step 1: Get Your Free API Key**

1. **Go to Google AI Studio:**
   ```
   https://makersuite.google.com/app/apikey
   ```
   OR
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **Sign in with your Google Account**
   - Use any Gmail account
   - No credit card needed!

3. **Click "Create API Key"**
   - Click the big blue button that says **"Create API key"**
   - Choose **"Create API key in new project"**
   - Wait 5-10 seconds for it to generate

4. **Copy Your API Key**
   - You'll see a key like: `AIzaSyABC123...XYZ789`
   - Click the **Copy** button (📋 icon)
   - **Keep this key secret!** Don't share it publicly

---

### **Step 2: Add to Your Project**

1. **Open your `.env` file** in the `backend` folder:
   ```
   D:\AbhiramRootmentsProject\AiProject\backend\.env
   ```

2. **Add this line** at the bottom:
   ```env
   # Google Gemini API Key (FREE - 1.5M tokens/day)
   GEMINI_API_KEY=AIzaSyABC123...XYZ789
   ```
   *(Replace `AIzaSyABC123...XYZ789` with your actual key)*

3. **Your `.env` file should now look like this:**
   ```env
   # Groq API Key (FREE - 100k tokens/day)
   GROQ_API_KEY=your_groq_api_key_here
   
   # Google Gemini API Key (FREE - 1.5M tokens/day)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # MongoDB Connection
   MONGODB_URI=mongodb+srv://...
   ```

4. **Save the file** (Ctrl + S)

---

### **Step 3: Restart Backend**

```bash
cd backend
npm start
```

You should see:
```
🔑 Groq API Key check: Found
🔑 Groq API Key length: 56
🔑 Gemini API Key check: Found
🔑 Gemini API Key length: 39
```

---

## 🚀 How It Works

### **Automatic Fallback System:**

1. **First:** Tries Groq (super fast, 100k tokens/day)
   ```
   📨 Sending DSR analysis request to Groq using llama-3.3-70b-versatile...
   ✅ Successfully parsed DSR analysis from Groq
   ```

2. **If Groq fails (rate limit 429):** Automatically switches to Gemini
   ```
   ❌ Groq API Failed: Request failed with status code 429
   🔄 Groq failed, switching to Google Gemini...
   📨 Sending DSR analysis request to Google Gemini...
   ✅ Successfully parsed DSR analysis from Gemini
   ```

3. **If both fail:** Uses rule-based fallback
   ```
   ❌ Gemini API Failed: ...
   🔄 All AI providers failed, using fallback response
   ```

---

## 📊 API Limits Comparison

| Provider | Free Tokens/Day | Requests/Day | Speed | Quality |
|----------|-----------------|--------------|-------|---------|
| **Groq** | 100,000 | ~1,000 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| **Google Gemini** | **1,500,000** | **1,500** | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ |

**Result:** You get **16x more API calls per day!** 🎉

---

## 🧪 Test It

### **Test 1: Check API Keys**

Run backend and look for:
```
🔑 Groq API Key check: Found ✅
🔑 Gemini API Key check: Found ✅
```

### **Test 2: Trigger Rate Limit (Optional)**

1. Run DSR analysis multiple times until Groq hits rate limit
2. Watch the logs switch to Gemini automatically:
   ```
   ❌ Groq API Failed: 429
   🔄 Groq failed, switching to Google Gemini...
   📨 Sending DSR analysis request to Google Gemini...
   ✅ Successfully parsed DSR analysis from Gemini
   ```

### **Test 3: Remove Groq Key (Optional)**

Temporarily comment out Groq in `.env`:
```env
# GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
```

Backend will use Gemini as primary:
```
🔑 Groq API Key check: Missing
🔑 Gemini API Key check: Found ✅
📨 Sending DSR analysis request to Google Gemini...
```

---

## 🔍 Troubleshooting

### **Problem 1: "Gemini API Key check: Missing"**

**Solution:**
1. Check `.env` file in `backend` folder (not root)
2. Make sure line is: `GEMINI_API_KEY=AIzaSy...` (no spaces around `=`)
3. Restart backend: `npm start`

### **Problem 2: "Gemini API Failed: 403 Forbidden"**

**Solution:**
1. Check API key is correct (copy-paste from Google AI Studio)
2. Enable the API:
   - Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
   - Click **"Enable"**
3. Wait 2-3 minutes for it to activate

### **Problem 3: "Gemini API Failed: 400 Bad Request"**

**Solution:**
- Your API key might have quotas disabled
- Go to: https://aistudio.google.com/app/apikey
- Delete old key and create a new one

### **Problem 4: Both APIs Failing**

**Solution:**
- System automatically uses rule-based fallback
- You'll still get action plans (generic but functional)
- Check both API keys are valid

---

## 📸 Visual Guide

### **Google AI Studio:**

```
┌─────────────────────────────────────────────────┐
│  Google AI Studio                         [×]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔑 API Keys                                    │
│                                                 │
│  Create an API key to access Gemini API        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  🔵 Create API key                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Your API Keys:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ AIzaSyABC123...XYZ789      📋 Copy       │ │
│  │ Created: Oct 25, 2025                     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ Summary

**What You Did:**
1. ✅ Got free Gemini API key (1.5M tokens/day)
2. ✅ Added to `.env` file
3. ✅ Restarted backend

**What Your System Now Does:**
1. 🚀 Tries Groq first (fast)
2. 🔄 Falls back to Gemini (if Groq fails)
3. 📊 Uses rule-based (if both fail)
4. ✅ **Always works!**

**Benefits:**
- 🎉 **16x more API calls per day**
- 🚀 **Automatic failover**
- 💯 **No downtime**
- 🆓 **Still 100% free!**

---

## 🔗 Useful Links

- **Get API Key:** https://makersuite.google.com/app/apikey
- **Gemini Docs:** https://ai.google.dev/docs
- **Pricing:** https://ai.google.dev/pricing (Free tier is generous!)
- **API Console:** https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

---

## 🎊 You're All Set!

Your system now has:
- ✅ Groq (100k tokens/day) - Primary
- ✅ Gemini (1.5M tokens/day) - Backup
- ✅ Rule-based fallback - Always works

**Total:** 1.6 million tokens/day for FREE! 🎉

