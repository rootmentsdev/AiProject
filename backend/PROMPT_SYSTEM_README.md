# AI Prompt Management System

This system manages AI prompts for generating action plans based on DSR (Daily Sales Report) and cancellation data correlation.

## 📁 Structure

```
backend/
├── config/
│   ├── actionPlanPrompts.js      # Main prompt templates
│   └── promptTemplates/          # Saved prompt versions
├── utils/
│   └── promptLogger.js           # Prompt logging utility
└── logs/
    └── prompts/                  # Generated prompt logs
```

## 🎯 How It Works

### 1. **DSR-Cancellation Correlation**
The system:
1. Analyzes DSR sheet for problems (low sales, low conversion)
2. Fetches cancellation data for the same date
3. Correlates DSR problems with cancellation reasons by store
4. Generates targeted action plans

### 2. **Smart Action Plans**
Example correlations:
- **Low Conversion** + "Product not available" → **Action**: Stock more products
- **Low Sales** + "Price too high" → **Action**: Review pricing
- **Problems** + "Billing errors" → **Action**: Train staff on billing

### 3. **Prompt Logging**
Every AI request is logged with:
- Full prompt sent
- AI response received
- Metadata (model used, data analyzed, etc.)
- Timestamp

## 📋 Files

### `config/actionPlanPrompts.js`
Contains:
- `getActionPlanPrompt(data)` - Generates prompts based on correlation data
- `ACTION_PLAN_SYSTEM_PROMPT` - System-level instructions for AI

### `utils/promptLogger.js`
Utilities for:
- Saving prompts and responses
- Storing templates
- Retrieving recent logs

## 🔧 Usage

### In Code:
```javascript
const { getActionPlanPrompt } = require('./config/actionPlanPrompts');

const promptData = {
  storeCorrelations: [...],  // DSR problems matched with cancellations
  totalLoss: 50000,
  totalCancellations: 25
};

const prompt = getActionPlanPrompt(promptData);
```

### Logs Location:
- Prompts: `backend/logs/prompts/prompt_[timestamp].json`
- Templates: `backend/config/promptTemplates/`

## 📊 Example Correlation

```
Store: Edapally
DSR Problem: Low Conversion (30%)
DSR Loss: ₹15,000
Cancellations: 8

Top Cancellation Reasons:
1. "Product not available" (5 times)
2. "Size not available" (2 times)
3. "Better price elsewhere" (1 time)

AI Generated Action:
→ "Stock 50 more units of popular items in sizes 38-44"
→ "Expected Impact: 20% increase in conversion"
→ "Timeline: 2 weeks"
```

## 🎨 Customization

To modify prompts:
1. Edit `backend/config/actionPlanPrompts.js`
2. Adjust the logic in `getActionPlanPrompt()` function
3. Update examples and instructions
4. System automatically logs all changes

## 📝 Notes

- All prompts are automatically logged
- Logs help improve future prompts
- Templates can be versioned for A/B testing
- System handles AI service failures gracefully with fallback plans

