# 🤖 AI Integration Guide

This document explains how to set up and use the AI backend for your LPG Inventory & Debt Management System.

## Overview

The AI backend provides three main features:

1. **Expense Anomaly Detection** - Identify unusual expense patterns
2. **Demand Forecasting** - Predict future demand for inventory planning
3. **Debt Risk Scoring** - Assess client credit risk automatically

## Architecture

```
Next.js Frontend
       ↓
[/api/ai/* endpoints]
       ↓
Python Flask Backend (port 5000)
       ↓
[ML Models]
```

## Setup Instructions

### 1. Python Environment Setup

Windows:
```bash
cd ai-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

macOS/Linux:
```bash
cd ai-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start Python Backend

```bash
cd ai-backend
python app.py
```

You should see:
```
 * Running on http://localhost:5000
 * Debug mode: on
```

### 3. Configure Next.js

Add to `.env.local`:
```
AI_BACKEND_URL=http://localhost:5000
```

### 4. Run Next.js App

In another terminal:
```bash
npm run dev
```

Visit: http://localhost:3000/ai-dashboard

## API Endpoints

### Expense Anomaly Detection

**Endpoint:** `POST /api/ai/anomalies`

**Request:**
```json
{
  "expenses": [
    { "date": "2026-01-01", "category": "fuel", "amount": 5000 },
    { "date": "2026-01-02", "category": "fuel", "amount": 5200 }
  ]
}
```

**Response:**
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
    "total_records": 30,
    "anomalies_detected": 1,
    "normal_threshold": 5100,
    "normal_range": [0, 10200],
    "insight": "1 unusual expense detected..."
  }
}
```

### Demand Forecasting

**Endpoint:** `POST /api/ai/forecast`

**Request:**
```json
{
  "sales_history": [
    { "date": "2026-01-01", "cylinderSizeId": 1, "quantity": 10 },
    { "date": "2026-01-02", "cylinderSizeId": 1, "quantity": 12 }
  ],
  "forecast_days": 7,
  "cylinder_size_id": 1
}
```

**Response:**
```json
{
  "cylinder_size_id": 1,
  "forecast": [
    {
      "date": "2026-02-04",
      "predicted_quantity": 15.3,
      "confidence_interval": [12.1, 18.5]
    }
  ],
  "summary": {
    "average_forecast": 15.2,
    "historical_average": 14.8,
    "trend": "increasing",
    "confidence_level": 0.95,
    "data_points_used": 25,
    "insight": "Demand rising 2.7%..."
  }
}
```

### Debt Risk Scoring

**Endpoint:** `POST /api/ai/debt-risk`

**Request:**
```json
{
  "clientId": 1,
  "totalDebt": 50000,
  "creditLimit": 100000,
  "daysOverdue": 30,
  "paymentHistory": [
    { "date": "2026-01-01", "paid": true },
    { "date": "2026-01-15", "paid": false }
  ]
}
```

**Response:**
```json
{
  "client_id": 1,
  "risk_score": 52.5,
  "risk_level": "MEDIUM",
  "recommended_action": "Review and consider credit adjustment",
  "breakdown": {
    "debt_ratio": 40.0,
    "overdue_score": 15.0,
    "payment_reliability": 7.5
  }
}
```

## How the Models Work

### Expense Anomaly Detection

Uses **Isolation Forest** algorithm:
- Isolates anomalies by creating random decision trees
- Works without assuming normal distribution
- Excellent for detecting fraud or operational issues
- No labeled training data needed

**Key Metrics:**
- Analyzes amount, category, and frequency
- Returns anomaly scores 0-1 (higher = more anomalous)
- Provides normal range (mean ± 2 std dev)

### Demand Forecasting

Uses **Exponential Smoothing**:
- Weights recent data more heavily (α=0.3)
- Captures trends in demand patterns
- Provides 95% confidence intervals
- Works well with short time series

**Key Outputs:**
- 7-day forecast with predicted quantities
- Confidence intervals for uncertainty bounds
- Trend direction (increasing/decreasing/stable)
- Actionable insights for inventory planning

### Debt Risk Scoring

Uses **Weighted Risk Formula**:
```
Risk Score = Debt Ratio (40) + Overdue Score (30) + Payment History (30)
```

**Categories:**
- **LOW (0-30):** Monitor normally
- **MEDIUM (30-60):** Review terms, consider adjustment
- **HIGH (60-100):** Prioritize collection, consider suspension

## Troubleshooting

### "Cannot connect to AI backend"
- Ensure Python backend is running: `python app.py`
- Check `AI_BACKEND_URL` in `.env.local`
- Verify Flask is listening on port 5000

### "Insufficient data for anomaly detection"
- Minimum 5 records required
- Collect more expense data before running

### "No forecast generated"
- Minimum 3 historical data points required per cylinder size
- Ensure sales data exists for selected cylinder

## Performance Tips

1. **Run forecasts during off-peak hours** to avoid impacting production
2. **Collect 30+ days of data** for better predictions
3. **Review anomalies weekly** to establish baselines
4. **Use risk scores for prioritization**, not just cutoffs

## Future Enhancements (Phase 2)

- [ ] Dynamic pricing optimization
- [ ] Supplier price prediction
- [ ] Client segmentation clustering
- [ ] Automated NLG report generation
- [ ] Real-time alerts for anomalies
- [ ] Custom model training on your data

## Support

For issues or questions:
1. Check the terminal logs of both Flask and Next.js
2. Review API response error messages
3. Ensure all dependencies are installed
