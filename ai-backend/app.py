from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from models.expense_anomaly import ExpenseAnomalyDetector
from models.demand_forecast import DemandForecastor

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize AI models
expense_detector = ExpenseAnomalyDetector()
demand_forecaster = DemandForecastor()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'LPG AI Backend'}), 200

@app.route('/api/ai/detect-expense-anomalies', methods=['POST'])
def detect_expense_anomalies():
    """
    Detect anomalies in expenses
    
    Request body:
    {
        "expenses": [
            {"date": "2026-01-01", "category": "fuel", "amount": 5000},
            {"date": "2026-01-02", "category": "fuel", "amount": 5200},
            ...
        ]
    }
    
    Response:
    {
        "anomalies": [
            {"index": 5, "date": "2026-01-06", "amount": 15000, "category": "fuel", "anomaly_score": 0.95}
        ],
        "summary": {
            "total_records": 30,
            "anomalies_detected": 1,
            "normal_threshold": 8500
        }
    }
    """
    try:
        data = request.get_json()
        expenses = data.get('expenses', [])
        
        if not expenses:
            return jsonify({'error': 'No expenses provided'}), 400
        
        result = expense_detector.detect(expenses)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/forecast-demand', methods=['POST'])
def forecast_demand():
    """
    Forecast future demand based on historical sales
    
    Request body:
    {
        "sales_history": [
            {"date": "2026-01-01", "cylinderSizeId": 1, "quantity": 10},
            {"date": "2026-01-02", "cylinderSizeId": 1, "quantity": 12},
            ...
        ],
        "forecast_days": 7,
        "cylinder_size_id": 1
    }
    
    Response:
    {
        "cylinder_size_id": 1,
        "forecast": [
            {"date": "2026-02-04", "predicted_quantity": 15, "confidence_interval": [12, 18]},
            ...
        ],
        "summary": {
            "average_forecast": 15,
            "confidence_level": 0.85
        }
    }
    """
    try:
        data = request.get_json()
        sales_history = data.get('sales_history', [])
        forecast_days = data.get('forecast_days', 7)
        cylinder_size_id = data.get('cylinder_size_id')
        
        if not sales_history:
            return jsonify({'error': 'No sales history provided'}), 400
        
        result = demand_forecaster.forecast(sales_history, forecast_days, cylinder_size_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/debt-risk-score', methods=['POST'])
def debt_risk_score():
    """
    Calculate debt risk score for a client
    
    Request body:
    {
        "clientId": 1,
        "totalDebt": 50000,
        "creditLimit": 100000,
        "daysOverdue": 30,
        "paymentHistory": [{"date": "2026-01-01", "paid": true}, ...]
    }
    """
    try:
        data = request.get_json()
        
        # Risk calculation
        total_debt = data.get('totalDebt', 0)
        credit_limit = data.get('creditLimit', 1)
        days_overdue = data.get('daysOverdue', 0)
        payment_history = data.get('paymentHistory', [])
        
        # Calculate base risk score (0-100)
        debt_ratio = min((total_debt / credit_limit) * 40, 40)  # Max 40 points
        overdue_score = min(days_overdue * 0.5, 30)  # Max 30 points (1 point per 2 days)
        
        # Payment history impact
        if payment_history:
            on_time_payments = sum(1 for p in payment_history if p.get('paid'))
            payment_ratio = on_time_payments / len(payment_history)
            payment_score = (1 - payment_ratio) * 30  # Max 30 points for bad history
        else:
            payment_score = 15  # Default for unknown history
        
        risk_score = debt_ratio + overdue_score + payment_score
        
        # Determine risk level
        if risk_score < 30:
            risk_level = "LOW"
            action = "Monitor"
        elif risk_score < 60:
            risk_level = "MEDIUM"
            action = "Review and consider credit adjustment"
        else:
            risk_level = "HIGH"
            action = "Prioritize for collection, consider suspension"
        
        return jsonify({
            'client_id': data.get('clientId'),
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'recommended_action': action,
            'breakdown': {
                'debt_ratio': round(debt_ratio, 2),
                'overdue_score': round(overdue_score, 2),
                'payment_reliability': round(payment_score, 2)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, port=port)
