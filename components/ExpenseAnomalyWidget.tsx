'use client';

import { useState } from 'react';

interface Anomaly {
  index: number;
  date: string;
  category: string;
  amount: number;
  anomaly_score: number;
}

interface AnomalyResult {
  anomalies: Anomaly[];
  summary: {
    total_records: number;
    anomalies_detected: number;
    normal_threshold: number;
    normal_range: [number, number];
    insight: string;
  };
}

export function ExpenseAnomalyWidget() {
  const [anomalies, setAnomalies] = useState<AnomalyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectAnomalies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch expenses from API
      const expensesRes = await fetch('/api/expenses');
      const expenses = await expensesRes.json();
      
      // Format expenses for AI backend
      const formattedExpenses = expenses.map((exp: any) => ({
        date: new Date(exp.createdAt).toISOString().split('T')[0],
        category: exp.category,
        amount: exp.amount,
      }));

      // Send to AI backend
      const response = await fetch('/api/ai/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: formattedExpenses }),
      });

      if (!response.ok) throw new Error('Failed to detect anomalies');
      
      const result = await response.json();
      setAnomalies(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">🔍 Expense Anomaly Detection</h2>
        <button
          onClick={detectAnomalies}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Analyze Expenses'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          ⚠️ {error}
        </div>
      )}

      {anomalies && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <p className="text-blue-900 font-semibold">💡 Insight</p>
            <p className="text-blue-800">{anomalies.summary.insight}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-800">{anomalies.summary.total_records}</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="text-sm text-red-600">Anomalies Found</p>
              <p className="text-2xl font-bold text-red-800">{anomalies.summary.anomalies_detected}</p>
            </div>
          </div>

          {anomalies.anomalies.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-red-800 mb-2">Flagged Expenses:</h3>
              <div className="space-y-2">
                {anomalies.anomalies.map((anom) => (
                  <div key={anom.index} className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="font-semibold text-red-900">
                      {anom.date} - {anom.category}
                    </p>
                    <p className="text-red-800">
                      Amount: ₦{anom.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-red-600">
                      Anomaly Score: {(anom.anomaly_score * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
