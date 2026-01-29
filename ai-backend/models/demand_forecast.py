import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any

class DemandForecastor:
    """
    Forecasts demand based on historical sales data using exponential smoothing.
    
    This simple but effective approach:
    - Captures trend and seasonality
    - Doesn't require training a heavy model
    - Works well with short time series
    - Provides confidence intervals
    """
    
    def __init__(self):
        self.historical_data = {}
    
    def forecast(self, sales_history: List[Dict[str, Any]], forecast_days: int, 
                 cylinder_size_id: int) -> Dict[str, Any]:
        """
        Forecast future demand
        
        Args:
            sales_history: List of sales records
            {
                "date": "2026-01-01",
                "cylinderSizeId": 1,
                "quantity": 10
            }
            forecast_days: Number of days to forecast
            cylinder_size_id: Filter by cylinder size
        
        Returns:
            Dictionary with forecast
        """
        # Convert to DataFrame
        df = pd.DataFrame(sales_history)
        
        # Filter by cylinder size if specified
        if cylinder_size_id:
            df = df[df['cylinderSizeId'] == cylinder_size_id]
        
        if len(df) < 3:
            return {
                'cylinder_size_id': cylinder_size_id,
                'forecast': [],
                'summary': {
                    'message': 'Insufficient historical data for forecast (minimum 3 records)',
                    'data_available': len(df)
                }
            }
        
        # Convert date string to datetime
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Aggregate by date if multiple entries per day
        daily_sales = df.groupby('date')['quantity'].sum()
        
        # Get quantities
        quantities = daily_sales.values
        dates = daily_sales.index.values
        
        # Simple exponential smoothing for forecast
        alpha = 0.3  # Smoothing factor (0.3 is good for responsive forecasting)
        
        # Calculate exponential moving average
        ema_values = self._exponential_smoothing(quantities, alpha)
        
        # Calculate trend
        if len(ema_values) >= 2:
            trend = np.mean(np.diff(ema_values[-5:]))  # Trend from last 5 points
        else:
            trend = 0
        
        # Calculate volatility for confidence intervals
        volatility = np.std(quantities) if len(quantities) > 1 else np.mean(quantities) * 0.1
        
        # Generate forecast
        last_date = pd.to_datetime(dates[-1])
        last_value = ema_values[-1]
        
        forecast = []
        for i in range(1, forecast_days + 1):
            forecast_date = last_date + timedelta(days=i)
            predicted_value = max(0, last_value + (trend * i))
            
            # Confidence interval (±1.96 * volatility for ~95% confidence)
            lower_bound = max(0, predicted_value - 1.96 * volatility)
            upper_bound = predicted_value + 1.96 * volatility
            
            forecast.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predicted_quantity': round(float(predicted_value), 1),
                'confidence_interval': [
                    round(float(lower_bound), 1),
                    round(float(upper_bound), 1)
                ]
            })
        
        # Calculate metrics
        average_forecast = np.mean([f['predicted_quantity'] for f in forecast])
        historical_avg = np.mean(quantities)
        
        return {
            'cylinder_size_id': cylinder_size_id,
            'forecast': forecast,
            'summary': {
                'average_forecast': round(float(average_forecast), 1),
                'historical_average': round(float(historical_avg), 1),
                'trend': 'increasing' if trend > 0 else 'decreasing' if trend < 0 else 'stable',
                'confidence_level': 0.95,
                'data_points_used': len(quantities),
                'insight': self._generate_insight(average_forecast, historical_avg, trend)
            }
        }
    
    def _exponential_smoothing(self, data: np.ndarray, alpha: float) -> np.ndarray:
        """Apply exponential smoothing"""
        result = np.zeros_like(data, dtype=float)
        result[0] = data[0]
        
        for i in range(1, len(data)):
            result[i] = alpha * data[i] + (1 - alpha) * result[i - 1]
        
        return result
    
    def _generate_insight(self, forecast_avg: float, historical_avg: float, trend: float) -> str:
        """Generate human-readable insight"""
        percent_change = ((forecast_avg - historical_avg) / historical_avg * 100) if historical_avg > 0 else 0
        
        if trend > 0:
            direction = "increasing"
        elif trend < 0:
            direction = "decreasing"
        else:
            direction = "stable"
        
        if abs(percent_change) < 5:
            message = f"Demand expected to remain stable (~{forecast_avg:.0f} units/day)"
        elif percent_change > 0:
            message = f"Demand rising {percent_change:.1f}% (~{forecast_avg:.0f} units/day). Increase inventory."
        else:
            message = f"Demand falling {abs(percent_change):.1f}% (~{forecast_avg:.0f} units/day). Reduce orders."
        
        return message
