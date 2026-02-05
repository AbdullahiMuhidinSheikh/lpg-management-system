'use client';

import { useState } from 'react';

interface Forecast {
  date: string;
  predicted_quantity: number;
  confidence_interval: [number, number];
}

interface ForecastResult {
  cylinder_size_id: number;
  forecast: Forecast[];
  summary: {
    average_forecast: number;
    historical_average: number;
    trend: string;
    confidence_level: number;
    data_points_used: number;
    insight: string;
  };
}

interface CylinderSize {
  id: number;
  label: string;
  kg: number;
}

interface DemandForecastWidgetProps {
  cylinderSizes: CylinderSize[];
}

export function DemandForecastWidget({ cylinderSizes }: DemandForecastWidgetProps) {
  const safeCylinderSizes = Array.isArray(cylinderSizes) ? cylinderSizes : []
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCylinderId, setSelectedCylinderId] = useState<number>(
    safeCylinderSizes[0]?.id || 1
  );

  const generateForecast = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch sales data from API
      const salesRes = await fetch('/api/sales');
      const rawSales = await salesRes.json();
      const sales = Array.isArray(rawSales) ? rawSales : [];
      
      // Format sales for AI backend
      const formattedSales = sales.map((sale: any) => ({
        date: new Date(sale.createdAt).toISOString().split('T')[0],
        cylinderSizeId: sale.cylinderSizeId,
        quantity: sale.quantity,
      }));

      // Send to AI backend
      const response = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_history: formattedSales,
          forecast_days: 7,
          cylinder_size_id: selectedCylinderId,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate forecast');
      
      const result = await response.json();
      setForecast(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = safeCylinderSizes.find(c => c.id === selectedCylinderId)?.label || 'Cylinder';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">📈 7-Day Demand Forecast</h2>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Cylinder Size
        </label>
        <select
          value={selectedCylinderId}
          onChange={(e) => setSelectedCylinderId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {safeCylinderSizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.label} ({size.kg}kg)
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={generateForecast}
        disabled={loading}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 mb-4"
      >
        {loading ? 'Generating Forecast...' : 'Generate Forecast'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          ⚠️ {error}
        </div>
      )}

      {forecast && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <p className="text-green-900 font-semibold">💡 Insight</p>
            <p className="text-green-800">{forecast.summary.insight}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Forecast Avg</p>
              <p className="text-2xl font-bold text-gray-800">
                {forecast.summary.average_forecast.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">/day</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Historical Avg</p>
              <p className="text-2xl font-bold text-gray-800">
                {forecast.summary.historical_average.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">/day</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Trend</p>
              <p className="text-2xl font-bold text-gray-800">
                {forecast.summary.trend === 'increasing' ? '📈' : forecast.summary.trend === 'decreasing' ? '📉' : '→'}
              </p>
              <p className="text-xs text-gray-500 capitalize">{forecast.summary.trend}</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Forecast for {selectedLabel}:</h3>
            <div className="space-y-2">
              {(forecast.forecast || []).map((item) => (
                <div key={item.date} className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex justify-between">
                    <p className="font-semibold text-blue-900">{item.date}</p>
                    <p className="font-bold text-blue-800">{item.predicted_quantity.toFixed(0)} units</p>
                  </div>
                  <p className="text-xs text-blue-600">
                    Confidence range: {item.confidence_interval[0].toFixed(0)} - {item.confidence_interval[1].toFixed(0)} units
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
