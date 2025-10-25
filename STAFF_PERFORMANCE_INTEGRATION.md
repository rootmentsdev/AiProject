# Staff Performance Integration - Root Cause Analysis System

## 🎯 Overview

This document explains the **Staff Performance API integration** that helps identify whether low DSR (Daily Sales Report) performance is caused by staff issues or other factors like cancellations, inventory, pricing, or competition.

## 📊 System Architecture

### Data Sources Integrated:
1. **DSR Analysis** - Daily sales performance metrics from Google Sheets
2. **Cancellation Report** - Customer cancellation data from Rootments API
3. **Staff Performance Report** - Individual staff and store performance metrics from Rootments API ✨ NEW

### Root Cause Analysis Flow:
```
DSR Shows Low Performance
        ↓
System Fetches 3 Data Sources (Same Date):
  1. DSR Metrics (Walk-ins, Bills, Conversion Rate)
  2. Cancellation Data (Reasons, Frequency)
  3. Staff Performance Data (Staff-level metrics)
        ↓
AI Analyzes ALL Data Together
        ↓
Identifies Root Cause:
  - Staff Performance Issues? (Training, Motivation)
  - High Cancellations? (Service, Product issues)
  - Other Factors? (Inventory, Competition, Location)
        ↓
Generates Targeted Action Plan
```

## 🔌 API Integration Details

### Staff Performance API Endpoint
```
POST https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel
```

### Request Parameters:
```json
{
  "DateFrom": "2025-8-21",
  "DateTo": "2025-8-21",
  "LocationID": "0",
  "UserID": "7777"
}
```

### Store Location ID Mapping:
```javascript
// Location IDs for each store:
z.edapall - 6
z edapally - 1
sg-edapally - 3
Trivandrum - 5
zperintahlmanna - 7
z kottakal - 8
z Kottayam - 9
sg Perumbavoor - 10
sg Trissur - 11
sg chavakkad - 12
sg Calicut - 13
sg vadakara - 14
sg edapall - 15
sg perinthalmanna - 16
sg kottkal - 17
sg manjeri - 18
sg Palakkad - 19
sg kalpatta - 20
sg Kannur - 21
```

## 🛠️ Implementation

### Backend Components

#### 1. Staff Performance Service (`backend/services/staffPerformanceService.js`)
- Fetches staff performance data from Rootments API
- Analyzes store-wise performance metrics
- Identifies staff-specific issues (low conversion, high loss of sale)
- Categorizes performance: CRITICAL, POOR, AVERAGE, GOOD

#### 2. Store Location Mapping (`backend/config/storeLocationMapping.js`)
- Maps DSR store names to API location IDs
- Handles fuzzy matching for name variations
- Example: "sg trissur" → Location ID "11"

#### 3. DSR Controller Updates (`backend/controllers/dsrController.js`)
- Integrated staff performance into `performIntegratedAnalysis`
- Updated `compareStores` to match DSR, Cancellation, AND Staff Performance
- Enhanced AI prompts with staff performance data
- Added root cause determination logic

#### 4. Routes (`backend/routes/dsrRoutes.js`)
- Added `/api/staff-performance-data` endpoint
- Uses DSR sheet date automatically (same as cancellation data)
- Supports custom date range if needed

### Frontend Components

#### Updated `IntegratedAnalysis.jsx`:
- Added **Staff Performance column** in table view
- Shows performance status badges (CRITICAL, POOR, AVERAGE, GOOD)
- Displays conversion rate percentage
- Shows staff count and issues
- Highlights when staff performance is a major contributor

## 📈 How It Works - Root Cause Analysis

### Example Scenario 1: Staff Performance is the Root Cause
```
Store: SG Thrissur
DSR Status: Poor (45% conversion rate)
Cancellations: Low (2 cancellations)
Staff Performance: CRITICAL (42% conversion rate)

✅ ROOT CAUSE: Staff Performance
   → Staff conversion rate matches DSR problems
   → Low cancellations rule out service issues
   → ACTION: Immediate staff training required
```

### Example Scenario 2: Cancellations are the Root Cause
```
Store: SG Edapally  
DSR Status: Poor (55% conversion rate)
Cancellations: High (8 cancellations - delivery issues)
Staff Performance: GOOD (75% conversion rate)

✅ ROOT CAUSE: High Cancellations
   → Staff performing well (75% conversion)
   → Cancellation reasons: "No response on delivery"
   → ACTION: Fix delivery communication system
```

### Example Scenario 3: External Factors
```
Store: Z Kottakkal
DSR Status: Poor (65% conversion rate)
Cancellations: Medium (4 cancellations - "Purchased from another store")
Staff Performance: AVERAGE (68% conversion rate)

✅ ROOT CAUSE: Competition & Pricing
   → Staff performance is acceptable
   → Customers going to competitors
   → ACTION: Review pricing, add loyalty program
```

## 🎯 AI-Powered Root Cause Determination

The system sends detailed prompts to AI with:
1. **DSR Metrics** (Walk-ins, Bills, Conversion Rate, Loss)
2. **Cancellation Reasons** (Frequency, Percentage, Impact)
3. **Staff Performance Data** (Individual staff metrics, Store conversion rate)

The AI analyzes:
- If staff conversion rate < 60% → **Staff is a MAJOR contributor**
- If high cancellations + good staff performance → **Service/Product issues**
- If both are acceptable → **External factors** (Competition, Location, Inventory)

## 📊 Data Display

### Summary Cards
```
┌──────────────────────────────────────┐
│ Critical Stores: 3                   │
│ Total Loss: ₹45,000                  │
│ Total Cancellations: 12              │
│ Est. Recovery: ₹31,500               │
└──────────────────────────────────────┘
```

### Store Analysis Table
```
┌────┬─────────────┬──────────┬───────────────┬────────┬─────────────┐
│ #  │ Store       │ DSR      │ Staff Perf.   │ Cancel │ Severity    │
├────┼─────────────┼──────────┼───────────────┼────────┼─────────────┤
│ 1  │ SG Thrissur │ Poor     │ CRITICAL 42%  │   2    │ CRITICAL    │
│ 2  │ SG Edapally │ Poor     │ GOOD 75%      │   8    │ HIGH        │
│ 3  │ Z Kottakkal │ Poor     │ AVERAGE 68%   │   4    │ MEDIUM      │
└────┴─────────────┴──────────┴───────────────┴────────┴─────────────┘
```

### Detailed Action Plan (Expandable)
Each store gets:
1. **Root Cause Analysis** with staff performance insights
2. **Immediate Actions** (24-48 hours)
3. **Short-term Actions** (1-2 weeks)
4. **Long-term Actions** (1-3 months)
5. **Expected Impact** with measurable KPIs

## 🚀 Usage

### Running the Analysis:
1. Navigate to "Integrated Analysis" page
2. Click "Run Analysis" button
3. System automatically:
   - Fetches DSR data (current date)
   - Fetches cancellation data (same date)
   - Fetches staff performance (same date)
   - Compares and matches stores
   - Generates AI-powered action plans

### Interpreting Results:

#### If Staff Performance is CRITICAL/POOR:
```
⚠️ Staff performance is a MAJOR CONTRIBUTOR to low DSR

Actions:
→ Emergency staff training session
→ Review staff motivation and incentives
→ Individual coaching for low performers
→ Implement performance tracking dashboard
```

#### If Staff Performance is GOOD:
```
✅ Staff performing well - Look at other factors

Possible Root Causes:
→ High cancellations (check reasons)
→ Inventory issues (out of stock)
→ Competition (pricing, location)
→ Product quality issues
```

## 🔍 Root Cause Decision Matrix

| DSR Performance | Staff Performance | Cancellations | Root Cause                |
|----------------|-------------------|---------------|---------------------------|
| Poor           | CRITICAL/POOR     | Low           | **Staff Training Needed** |
| Poor           | GOOD              | High          | **Service/Product Issues**|
| Poor           | AVERAGE           | Medium        | **Multiple Factors**      |
| Good           | GOOD              | High          | **Process Issues**        |

## 📁 Files Modified/Created

### Backend:
- ✨ `backend/services/staffPerformanceService.js` (NEW)
- ✨ `backend/config/storeLocationMapping.js` (NEW)
- 🔧 `backend/controllers/dsrController.js` (UPDATED)
- 🔧 `backend/routes/dsrRoutes.js` (UPDATED)

### Frontend:
- 🔧 `frontend/src/components/IntegratedAnalysis.jsx` (UPDATED)

### Documentation:
- ✨ `STAFF_PERFORMANCE_INTEGRATION.md` (THIS FILE)

## 🎓 Key Benefits

1. **Precise Root Cause Identification**: Know exactly if staff, cancellations, or other factors cause issues
2. **Data-Driven Decisions**: Based on 3 authoritative data sources
3. **Targeted Action Plans**: AI generates specific actions for each root cause
4. **Measurable Impact**: Track conversion rates, cancellations, and revenue recovery
5. **Comprehensive View**: See DSR + Cancellations + Staff Performance in one place

## 📞 API Response Structure

```json
{
  "success": true,
  "analysis": {
    "storeWisePerformance": {
      "SG Thrissur": {
        "storeName": "SG Thrissur",
        "walkIns": 120,
        "bills": 50,
        "quantity": 85,
        "lossOfSale": 15,
        "conversionRate": "41.67",
        "performanceStatus": "CRITICAL",
        "staffCount": 4,
        "staffIssues": [
          "John has critically low conversion (32%)",
          "Mary has high loss of sale (8)"
        ],
        "staffDetails": [
          {
            "name": "John",
            "walkIns": 30,
            "bills": 10,
            "conversionRate": 33.33,
            "lossOfSale": 5
          }
        ]
      }
    }
  }
}
```

## 🎯 Next Steps

1. **Start with Integrated Analysis**: Click "Run Analysis" to see all stores
2. **Identify Critical Stores**: Look for CRITICAL/HIGH severity stores
3. **Check Staff Performance Column**: Is it CRITICAL/POOR?
4. **Expand Store Details**: Click "View Plan" to see full analysis
5. **Read Root Cause Section**: AI explains if staff is the issue
6. **Execute Action Plan**: Follow Immediate → Short-term → Long-term actions
7. **Track Results**: Monitor conversion rate improvements

## 🔄 Date Synchronization

**Important**: All three data sources use the **SAME DATE** from the DSR sheet:
- DSR Sheet Date: 12/8/2025
- Cancellation Data: 12/8/2025 (automatically converted)
- Staff Performance: 12/8/2025 (automatically converted)

This ensures accurate correlation between DSR performance and its potential root causes.

## 💡 Pro Tips

1. **Focus on CRITICAL Staff Performance first**: Easiest to fix with training
2. **Cross-reference with Cancellation Reasons**: Validate staff issues
3. **Look for patterns**: Multiple stores with staff issues? Company-wide training needed
4. **Track individual staff**: Use staffDetails to coach specific employees
5. **Monitor trends**: Run analysis daily to see if actions are working

---

**Built with ❤️ to help identify and fix root causes of poor store performance**

