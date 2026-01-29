'use client';

import { useEffect, useState } from 'react';
import { ExpenseAnomalyWidget } from '@/components/ExpenseAnomalyWidget';
import { DemandForecastWidget } from '@/components/DemandForecastWidget';

interface CylinderSize {
  id: number;
  label: string;
  kg: number;
}

export default function AIDashboard() {
  const [cylinderSizes, setCylinderSizes] = useState<CylinderSize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch cylinder sizes for the forecast widget
    const fetchCylinderSizes = async () => {
      try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        // Extract cylinder sizes
        const sizes = products
          .flatMap((p: any) => p.cylinderSizes || [])
          .sort((a: any, b: any) => a.kg - b.kg);
        
        setCylinderSizes(sizes);
      } catch (error) {
        console.error('Failed to fetch cylinder sizes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCylinderSizes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🤖 AI Insights Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Advanced analytics powered by machine learning to optimize your LPG operations
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-gray-600 mt-4">Loading AI dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseAnomalyWidget />
            <DemandForecastWidget cylinderSizes={cylinderSizes} />

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 AI Features</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <p className="text-blue-900 font-semibold">🔍 Expense Anomaly Detection</p>
                  <p className="text-sm text-blue-700 mt-2">
                    Automatically detect unusual expenses that may indicate fraud or operational issues.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="text-green-900 font-semibold">📈 Demand Forecasting</p>
                  <p className="text-sm text-green-700 mt-2">
                    Predict future demand for each cylinder size and optimize inventory levels.
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded border border-purple-200">
                  <p className="text-purple-900 font-semibold">⚠️ Debt Risk Scoring</p>
                  <p className="text-sm text-purple-700 mt-2">
                    Automatically score client risk levels based on payment history and credit usage.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">🚀 Coming Soon</h3>
              <ul className="text-yellow-800 space-y-2">
                <li>✓ Dynamic pricing optimization based on demand and competitor analysis</li>
                <li>✓ Supplier performance analytics with price trend predictions</li>
                <li>✓ Client segmentation and targeted promotional campaigns</li>
                <li>✓ Automated report generation with actionable insights</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
