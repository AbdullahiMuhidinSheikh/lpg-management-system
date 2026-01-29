# 🧪 Testing AI Features

This guide shows how to test the AI features with sample data.

## 1. Test Expense Anomaly Detection

### Using curl (from command line):

```bash
curl -X POST http://localhost:5000/api/ai/detect-expense-anomalies \
  -H "Content-Type: application/json" \
  -d '{
    "expenses": [
      {"date": "2026-01-01", "category": "fuel", "amount": 5000},
      {"date": "2026-01-02", "category": "fuel", "amount": 5200},
      {"date": "2026-01-03", "category": "fuel", "amount": 5100},
      {"date": "2026-01-04", "category": "fuel", "amount": 5300},
      {"date": "2026-01-05", "category": "fuel", "amount": 5150},
      {"date": "2026-01-06", "category": "fuel", "amount": 15000},
      {"date": "2026-01-07", "category": "repairs", "amount": 3000}
    ]
  }'
```

### Expected Response:
```json
{
  "anomalies": [
    {
      "index": 5,
      "date": "2026-01-06",
      "category": "fuel",
      "amount": 15000,
      "anomaly_score": 0.95
    }
  ],
  "summary": {
    "total_records": 7,
    "anomalies_detected": 1,
    "normal_threshold": 5258.57,
    "normal_range": [0, 10517.14],
    "insight": "1 unusual expense detected. Average expense: ₦5,259 ± ₦2,629"
  }
}
```

**What this shows:**
- ✅ Anomaly detected on Jan 6 (₦15,000 vs normal ₦5,000-5,300)
- ✅ Anomaly score: 95% confidence it's unusual
- ✅ Normal range calculated: ₦0-10,517

---

## 2. Test Demand Forecasting

### Using curl:

```bash
curl -X POST http://localhost:5000/api/ai/forecast-demand \
  -H "Content-Type: application/json" \
  -d '{
    "sales_history": [
      {"date": "2026-01-01", "cylinderSizeId": 1, "quantity": 10},
      {"date": "2026-01-02", "cylinderSizeId": 1, "quantity": 12},
      {"date": "2026-01-03", "cylinderSizeId": 1, "quantity": 11},
      {"date": "2026-01-04", "cylinderSizeId": 1, "quantity": 13},
      {"date": "2026-01-05", "cylinderSizeId": 1, "quantity": 14},
      {"date": "2026-01-06", "cylinderSizeId": 1, "quantity": 15},
      {"date": "2026-01-07", "cylinderSizeId": 1, "quantity": 16}
    ],
    "forecast_days": 7,
    "cylinder_size_id": 1
  }'
```

### Expected Response:
```json
{
  "cylinder_size_id": 1,
  "forecast": [
    {
      "date": "2026-01-08",
      "predicted_quantity": 16.5,
      "confidence_interval": [13.2, 19.8]
    },
    {
      "date": "2026-01-09",
      "predicted_quantity": 17.0,
      "confidence_interval": [13.7, 20.3]
    }
    // ... 5 more days
  ],
  "summary": {
    "average_forecast": 16.5,
    "historical_average": 12.86,
    "trend": "increasing",
    "confidence_level": 0.95,
    "data_points_used": 7,
    "insight": "Demand rising 28.1% (~16.5 units/day). Increase inventory."
  }
}
```

**What this shows:**
- ✅ Forecast generated for next 7 days
- ✅ Trend: Increasing (10 → 16 units)
- ✅ Confidence intervals provided (margin of error)
- ✅ Actionable insight: "Increase inventory"

---

## 3. Test Debt Risk Scoring

### Using curl:

```bash
curl -X POST http://localhost:5000/api/ai/debt-risk-score \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "totalDebt": 75000,
    "creditLimit": 100000,
    "daysOverdue": 30,
    "paymentHistory": [
      {"date": "2025-12-01", "paid": true},
      {"date": "2025-12-15", "paid": true},
      {"date": "2026-01-01", "paid": false},
      {"date": "2026-01-15", "paid": false}
    ]
  }'
```

### Expected Response:
```json
{
  "client_id": 1,
  "risk_score": 60.0,
  "risk_level": "MEDIUM",
  "recommended_action": "Review and consider credit adjustment",
  "breakdown": {
    "debt_ratio": 30.0,
    "overdue_score": 15.0,
    "payment_reliability": 15.0
  }
}
```

**What this shows:**
- ✅ Risk score: 60/100 (MEDIUM risk)
- ✅ Breakdown shows weighted components
- ✅ Recommendation: Review credit terms
- ✅ Can use to auto-adjust credit limits

---

## 4. Test via UI (Web Interface)

### Step 1: Start Both Services
```bash
# Terminal 1: AI Backend
start-ai-backend.bat

# Terminal 2: Next.js App
npm run dev
```

### Step 2: Visit Dashboard
Navigate to: http://localhost:3000/ai-dashboard

### Step 3: Click Buttons
- **"Analyze Expenses"** button → Loads actual expense data
- **"Generate Forecast"** button → Forecasts demand
- See real-time results with insights

---

## 5. Integration Testing (From Next.js)

### Test Anomaly Detection API:
```javascript
// In browser console or a test file
const response = await fetch('/api/ai/anomalies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    expenses: [
      { date: "2026-01-01", category: "fuel", amount: 5000 },
      { date: "2026-01-02", category: "fuel", amount: 5000 },
      // ... more expenses
    ]
  })
});
const result = await response.json();
console.log(result);
```

### Test Forecast API:
```javascript
const response = await fetch('/api/ai/forecast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sales_history: [
      { date: "2026-01-01", cylinderSizeId: 1, quantity: 10 },
      // ... more sales
    ],
    forecast_days: 7,
    cylinder_size_id: 1
  })
});
const result = await response.json();
console.log(result);
```

---

## 6. Testing Checklist

### Before Deploying to Production

- [ ] Python backend starts without errors
- [ ] Flask runs on port 5000
- [ ] Next.js app connects to backend
- [ ] Anomaly detection works with test data
- [ ] Forecast generates for 7 days
- [ ] Risk scoring calculates correctly
- [ ] UI displays results with proper formatting
- [ ] No console errors in browser
- [ ] Error handling works (try missing data)

---

## 7. Debugging Tips

### Backend Logs
Check the Flask terminal for errors:
```
ERROR in app.run_server: [error message]
```

### Frontend Logs
Open browser DevTools (F12):
- Network tab → `/api/ai/*` requests
- Console → Error messages
- Response → See actual JSON

### Common Issues

**Issue: "Cannot connect to AI backend"**
```bash
# Check if Flask is running
curl http://localhost:5000/health
# Should return: {"status": "ok"}
```

**Issue: "Insufficient data for anomaly detection"**
```
# Need minimum 5 expense records
```

**Issue: "Module not found (pandas, sklearn)"**
```bash
cd ai-backend
pip install -r requirements.txt
```

---

## 8. Performance Testing

### Measure Response Times

```bash
# Test Anomaly Detection Speed
time curl -X POST http://localhost:5000/api/ai/detect-expense-anomalies \
  -H "Content-Type: application/json" \
  -d '{"expenses": [...data...]}'

# Expected: <100ms
```

```bash
# Test Forecast Speed
time curl -X POST http://localhost:5000/api/ai/forecast-demand \
  -H "Content-Type: application/json" \
  -d '{"sales_history": [...data...]}'

# Expected: <200ms
```

---

## 9. Load Testing

### Simple load test with Python:
```python
import requests
import time

url = 'http://localhost:5000/api/ai/detect-expense-anomalies'
data = {
    "expenses": [{"date": f"2026-01-{i:02d}", "category": "fuel", "amount": 5000 + i*100} for i in range(1, 31)]
}

start = time.time()
for i in range(10):
    response = requests.post(url, json=data)
    print(f"Request {i+1}: {response.status_code} - {time.time()-start:.3f}s")
end = time.time()
print(f"Total: {end-start:.3f}s for 10 requests")
```

Expected: All requests complete in <2 seconds total

---

## 10. Next Steps

✅ **Basic Testing Complete?** → Deploy to production!

📈 **Want to improve?** → Try Phase 2 features:
- Dynamic pricing optimization
- Supplier analytics
- Client segmentation

---

## Support

For issues:
1. Check logs in both terminals
2. Review API response in Network tab
3. Verify `.env` and `.env.local` files
4. See [AI_INTEGRATION.md](AI_INTEGRATION.md) for detailed setup
