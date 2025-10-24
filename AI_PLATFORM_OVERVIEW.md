# 🤖 AI-Powered Business Intelligence Platform

## Overview
This platform uses AI to analyze **DSR (Daily Sales Report)** data and **Cancellation Data** to identify why stores are underperforming and provide actionable CEO-level recommendations.

---

## 🎯 Core Problem Being Solved

### **Question**: Why is our DSR becoming low?

**Answer**: The platform connects multiple data sources to find the root cause:

1. **DSR Performance Issues**
   - Low walk-in to bill conversion
   - Poor sales performance
   - Inventory problems
   - Staff efficiency issues

2. **Cancellation Impact**
   - High cancellation rates affecting revenue
   - Customer dissatisfaction patterns
   - Delivery and service issues
   - Competition impact

3. **Combined Analysis**
   - **CRITICAL STORES**: Poor DSR + High Cancellations = Urgent attention needed
   - **DSR-Only Issues**: Sales problems without cancellations
   - **Cancellation-Only Issues**: Good sales but high cancellations

---

## 🧠 How AI Analysis Works

### **Step 1: DSR Analysis (Google Sheets)**
```
Input: Daily Sales Report (Walk-ins, Bills, Revenue by Store)
↓
AI Model: Google Gemini 2.0 Flash
↓
Output: 
- Identify underperforming stores
- Calculate revenue loss
- Find root causes (conversion, inventory, staff issues)
```

### **Step 2: Cancellation Analysis (External API)**
```
Input: Cancellation data from booking API (Date range)
↓
System Analysis: Pattern detection
↓
Output:
- Total cancellations per store
- Top cancellation reasons
- Cancellation trends
```

### **Step 3: Store Matching & Correlation**
```
DSR Stores <--Fuzzy Match--> Cancellation Stores
(e.g., "Kochi Store" → "SG.Kochi")
↓
Correlation Engine:
- Stores with BOTH problems (Critical)
- Stores with only DSR issues
- Stores with only cancellations
```

### **Step 4: AI-Powered Action Plans**
```
For Each Store:
Input to AI:
- Store name and location
- DSR performance metrics
- Cancellation reasons and count
- Revenue loss amount
- Problem severity

AI Prompt Structure:
"You are analyzing [Store Name], a costume rental store in Kerala...
⚠️ CRITICAL: Poor sales (₹X loss) + High cancellations (Y orders)
📊 DSR Issues: [List of issues]
❌ Cancellation Reasons: [Top reasons with percentages]
🎯 Generate: Immediate/Short-term/Long-term action plan"

↓
AI Model: Google Gemini 2.0 Flash
↓
Output:
{
  "suggestions": ["Root cause analysis", "Pattern insights"],
  "immediate": ["3 actions for 24-48 hours"],
  "shortTerm": ["3 actions for 1-2 weeks"],
  "longTerm": ["3 strategic actions for 1-3 months"],
  "expectedImpact": "Measurable outcomes"
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────┐
│  Google Sheets DSR  │
│  (Daily Sales)      │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │   AI Model   │ ◄─── OpenRouter API (Gemini 2.0)
    │  (Analysis)  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐
    │  DSR Analysis    │
    │  - Bad Stores    │
    │  - Root Causes   │
    │  - Revenue Loss  │
    └──────┬───────────┘
           │
           │     ┌─────────────────────┐
           │     │  Cancellation API   │
           │     │  (Booking System)   │
           │     └──────────┬──────────┘
           │                │
           ▼                ▼
    ┌──────────────────────────────┐
    │   Store Matching Engine      │
    │   (Fuzzy Name Matching)      │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │   Correlation & Severity     │
    │   Classification             │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │   AI Action Plan Generator   │ ◄─── OpenRouter API (Gemini 2.0)
    │   (Per Store Analysis)       │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │   Frontend Dashboard         │
    │   - Executive Summary        │
    │   - Store Table with Plans   │
    │   - Expandable Details       │
    └──────────────────────────────┘
```

---

## 🎨 Platform Features

### **1. DSR Analysis Tab**
- Upload/Analyze Google Sheets DSR data
- AI identifies bad-performing stores
- Root cause analysis
- Revenue loss calculation
- Actionable suggestions

### **2. Cancellation Data Tab**
- Select date to view cancellations
- Store-wise cancellation breakdown
- Top cancellation reasons
- Visual charts and metrics

### **3. Action Plan Tab** ⭐ (NEW)
- **Executive Summary Cards**:
  - Critical Stores Count
  - Total Revenue Loss
  - Total Cancellations
  - Recovery Potential

- **Interactive Table**:
  - All stores with cancellations
  - DSR Status (Good/Poor)
  - Severity badges (Critical/High/Medium/Low)
  - Expandable action plans

- **AI-Generated Action Plans**:
  - **Key Insights**: Root cause analysis
  - **Immediate Actions** (24-48 hours)
  - **Short-term Actions** (1-2 weeks)
  - **Long-term Strategy** (1-3 months)
  - **Expected Impact**: Measurable outcomes

---

## 🔍 How to Use the Platform

### **Scenario 1: Find Why DSR is Low**
1. Go to **DSR Analysis** tab
2. Click "Analyze Sheet"
3. AI identifies stores with poor performance
4. View root causes (conversion issues, inventory, staff problems)

### **Scenario 2: Check Cancellation Impact**
1. Go to **Cancellation Data** tab
2. Select date
3. View which stores have high cancellations
4. Identify top reasons

### **Scenario 3: Get Comprehensive Action Plan** ⭐
1. Go to **Action Plan** tab
2. Click "Run Analysis"
3. System connects DSR + Cancellation data
4. AI generates specific action plans for each store
5. Stores categorized by severity:
   - **CRITICAL**: Poor DSR + High Cancellations
   - **HIGH**: Significant issues in one area
   - **MEDIUM**: Moderate issues
   - **LOW**: Minor improvements needed

---

## 💡 AI Insights Examples

### **Example 1: Critical Store (Both Problems)**
**Store**: Kannur Store
**DSR Issues**:
- Walk-in to bill conversion: 10%
- Revenue loss: ₹45,000
- Root cause: Poor product knowledge, inventory gaps

**Cancellation Issues**:
- 8 cancellations
- Reasons: "Delivery delay" (50%), "Changed costume" (30%)

**AI Action Plan**:
- **Immediate**:
  - Conduct emergency staff training on top 20 products
  - Fix delivery communication - call customers immediately
  - Offer flexible costume changes with minimal fees
  
- **Short-term**:
  - Implement conversion tracking dashboard
  - Set up automated delivery reminders
  - Create "try before you decide" policy
  
- **Long-term**:
  - Build customer loyalty program
  - Upgrade store ambiance and displays
  - Invest in staff incentive program

- **Expected Impact**: ₹31,500 revenue recovery + 5 fewer cancellations in 2 months

---

### **Example 2: Good DSR but Cancellations**
**Store**: Edappal Store
**DSR Status**: ✅ GOOD (Meeting sales targets)
**Cancellation Issues**:
- 4 cancellations
- Reasons: "Purchased from another store" (75%)

**AI Action Plan**:
- **Immediate**:
  - DSR performance is good - maintain current strategies
  - Match competitor prices + offer 10% loyalty discount
  
- **Short-term**:
  - Create exclusive benefits for repeat customers
  - Build "save the sale" protocol
  
- **Long-term**:
  - Develop customer retention program
  - Strengthen competitive positioning

---

## 🔧 Technical Architecture

### **Backend (Node.js + Express)**
- `dsrController.js`: Main analysis logic
- `dsrModel.js`: AI integration for DSR analysis
- `cancellationService.js`: Fetches cancellation data
- `dateConverter.js`: Smart date parsing (DD/MM/YYYY ↔ YYYY-M-D)
- `comparisonService.js`: Store matching algorithm

### **Frontend (React + Bootstrap)**
- `DSRAnalysisDashboard.jsx`: DSR analysis UI
- `CancellationDataView.jsx`: Cancellation data UI
- `IntegratedAnalysis.jsx`: Action plan UI with expandable tables

### **AI Integration**
- **Provider**: OpenRouter API
- **Model**: Google Gemini 2.0 Flash (Free tier)
- **Usage**:
  - DSR Analysis: ~500 tokens per request
  - Action Plans: ~300 tokens per store
- **Features**:
  - Context-aware prompts
  - JSON response parsing
  - Fallback to rule-based system

---

## 📈 Business Value

### **Before Platform**:
- ❌ Manual analysis of DSR sheets
- ❌ No correlation between sales and cancellations
- ❌ Generic action plans
- ❌ No prioritization

### **After Platform**:
- ✅ Automated AI analysis in seconds
- ✅ Clear correlation between DSR and cancellations
- ✅ Store-specific, actionable plans
- ✅ Severity-based prioritization
- ✅ Data-driven decision making
- ✅ Measurable impact predictions

---

## 🚀 Future Enhancements

1. **Multi-date Analysis**: Compare performance across multiple dates
2. **Trend Detection**: Identify patterns over weeks/months
3. **Predictive Analytics**: Forecast which stores need attention
4. **Automated Alerts**: Notify managers when stores become critical
5. **Staff Performance Tracking**: Individual salesperson metrics
6. **Customer Feedback Integration**: Connect reviews and ratings
7. **Inventory Integration**: Real-time stock availability
8. **WhatsApp Integration**: Send action plans directly to store managers

---

## 🎯 CEO Dashboard Summary

```
┌─────────────────────────────────────────────────┐
│  📊 BUSINESS HEALTH OVERVIEW                    │
├─────────────────────────────────────────────────┤
│  🚨 Critical Stores:  2                         │
│  💰 Total Loss:       ₹1,25,000                 │
│  ❌ Cancellations:    25                        │
│  💚 Recovery Est:     ₹87,500                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🎯 TOP PRIORITY ACTIONS                        │
├─────────────────────────────────────────────────┤
│  1. Kannur Store - CRITICAL                     │
│     → Staff training (TODAY)                    │
│     → Fix delivery communication                │
│                                                  │
│  2. Kochi Store - HIGH                          │
│     → Address inventory gaps                    │
│     → Reduce cancellation rate                  │
└─────────────────────────────────────────────────┘
```

---

## 📞 Support

For technical issues or questions:
- Check `API_DOCUMENTATION.md`
- Review `SETUP_INSTRUCTIONS.md`
- Check backend logs for debugging

---

**Built with ❤️ for Suitor Guy Kerala - Making Data-Driven Decisions Easy**

