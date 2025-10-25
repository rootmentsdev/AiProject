# 🏆 Worst Store Selection Algorithm

## 🎯 Purpose
Select the **MOST underperforming store** based on your criteria:
- **ABS < 1.80** (Average Bill Size)
- **ABV < 4500** (Average Bill Value in ₹)
- **Conversion < 80%** (Conversion Rate)

## 📊 "Badness Score" Calculation

### Algorithm
For each store, we calculate a "badness score" where **higher score = worse performance**:

```javascript
// 1. Calculate how far BELOW each threshold
convBadness = Max(0, 80 - conversionRate)
absBadness = Max(0, (1.8 - abs) * 50)
abvBadness = Max(0, (4500 - abv) / 100)

// 2. Calculate weighted total badness
badnessScore = (convBadness * 0.70) + (absBadness * 0.15) + (abvBadness * 0.15)
```

### Weights
- **Conversion Rate: 70%** (Most important - shows customer conversion)
- **ABS: 15%** (Items per bill)
- **ABV: 15%** (Revenue per bill)

## 📈 Example Calculations

### Store A: KALPETTA (Worst)
```
Conversion: 25.64%
ABS: 1.60
ABV: 4040

convBadness = 80 - 25.64 = 54.36
absBadness = (1.8 - 1.60) * 50 = 10.00
abvBadness = (4500 - 4040) / 100 = 4.60

badnessScore = (54.36 * 0.70) + (10.00 * 0.15) + (4.60 * 0.15)
             = 38.05 + 1.50 + 0.69
             = 40.24 ⭐ HIGHEST (WORST)
```

### Store B: Palakkad
```
Conversion: 65.63%
ABS: 1.27
ABV: 3500

convBadness = 80 - 65.63 = 14.37
absBadness = (1.8 - 1.27) * 50 = 26.50
abvBadness = (4500 - 3500) / 100 = 10.00

badnessScore = (14.37 * 0.70) + (26.50 * 0.15) + (10.00 * 0.15)
             = 10.06 + 3.98 + 1.50
             = 15.54
```

### Store C: Edappally (Better)
```
Conversion: 66.50%
ABS: 1.36
ABV: 4200

convBadness = 80 - 66.50 = 13.50
absBadness = (1.8 - 1.36) * 50 = 22.00
abvBadness = (4500 - 4200) / 100 = 3.00

badnessScore = (13.50 * 0.70) + (22.00 * 0.15) + (3.00 * 0.15)
             = 9.45 + 3.30 + 0.45
             = 13.20
```

### Ranking
1. 🥇 **KALPETTA** - Score: 40.24 (WORST) ← This will be shown
2. 🥈 **Palakkad** - Score: 15.54
3. 🥉 **Edappally** - Score: 13.20

## 🖥️ Terminal Output

When backend runs, you'll see:

```
🤖 STARTING AI-POWERED ACTION PLAN GENERATION
🤖 Total Stores Found: 13
⚠️  TEMPORARY LIMIT: Processing only 1 WORST store(s) to avoid API token limits

🏆 WORST Critical Store: KALPETTA (Conv: 25.64%, ABS: 1.60, ABV: 4040, Score: 40.24)
🏆 WORST DSR-Only Store: Palakkad (Conv: 65.63%, ABS: 1.27, ABV: 3500, Score: 15.54)

📊 Processing: 1 critical + 0 cancellation-only + 0 DSR-only stores
```

## ✅ Result

The system will:
1. ✅ Calculate badness score for ALL stores
2. ✅ Sort by HIGHEST score (worst performance)
3. ✅ Show the **#1 worst store** in frontend
4. ✅ Process only that 1 store to avoid API limits
5. ✅ Display detailed action plan for the worst performer

## 📁 Implementation

- **Frontend**: `frontend/src/components/IntegratedAnalysis.jsx` (lines 82-106)
- **Backend**: `backend/controllers/dsrController.js` (lines 804-840)

Both use the **same algorithm** to ensure consistency!


