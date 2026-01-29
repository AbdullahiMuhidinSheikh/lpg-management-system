import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta
from typing import List, Dict, Any

class ExpenseAnomalyDetector:
    """
    Detects anomalies in expense data using Isolation Forest algorithm.
    
    Isolation Forest is effective for expense anomaly detection because:
    - Works well with high-dimensional data
    - Doesn't assume normal distribution
    - Detects both univariate and multivariate anomalies
    - Fast and doesn't require labeled data
    """
    
    def __init__(self, contamination=0.1):
        """
        Initialize the anomaly detector
        
        Args:
            contamination: Expected proportion of outliers (0.1 = 10%)
        """
        self.contamination = contamination
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.scaler_params = None
        
    def detect(self, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Detect anomalies in expense data
        
        Args:
            expenses: List of expense records
            {
                "date": "2026-01-01",
                "category": "fuel",
                "amount": 5000
            }
        
        Returns:
            Dictionary with anomalies and summary
        """
        # Convert to DataFrame
        df = pd.DataFrame(expenses)
        
        if len(df) < 5:
            return {
                'anomalies': [],
                'summary': {
                    'total_records': len(df),
                    'anomalies_detected': 0,
                    'message': 'Insufficient data for anomaly detection (minimum 5 records)'
                }
            }
        
        # Extract numeric features
        amounts = df['amount'].values.reshape(-1, 1)
        
        # Normalize
        mean = amounts.mean()
        std = amounts.std()
        if std == 0:
            std = 1
        self.scaler_params = {'mean': mean, 'std': std}
        
        amounts_normalized = (amounts - mean) / std
        
        # Detect anomalies (-1 = anomaly, 1 = normal)
        predictions = self.model.fit_predict(amounts_normalized)
        anomaly_scores = self.model.score_samples(amounts_normalized)
        
        # Find anomalies
        anomalies = []
        for idx, (pred, score) in enumerate(zip(predictions, anomaly_scores)):
            if pred == -1:  # Anomaly detected
                anomalies.append({
                    'index': int(idx),
                    'date': str(df.iloc[idx]['date']),
                    'category': str(df.iloc[idx].get('category', 'unknown')),
                    'amount': float(df.iloc[idx]['amount']),
                    'anomaly_score': float(-score)  # Convert to positive scale (0-1)
                })
        
        return {
            'anomalies': anomalies,
            'summary': {
                'total_records': int(len(df)),
                'anomalies_detected': len(anomalies),
                'normal_threshold': float(mean),
                'normal_range': [float(mean - 2*std), float(mean + 2*std)],
                'insight': self._generate_insight(anomalies, mean, std)
            }
        }
    
    def _generate_insight(self, anomalies: List[Dict], mean: float, std: float) -> str:
        """Generate human-readable insight from anomalies"""
        if not anomalies:
            return "Expenses are within normal range. No anomalies detected."
        
        if len(anomalies) == 1:
            return f"1 unusual expense detected. Average expense: ₦{mean:,.0f} ± ₦{std:,.0f}"
        
        total_anomaly_amount = sum(a['amount'] for a in anomalies)
        return f"{len(anomalies)} unusual expenses totaling ₦{total_anomaly_amount:,.0f}. Check for fraud or operational issues."
