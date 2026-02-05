'use client'

import React, { useState, useEffect } from 'react'
import { Table } from '@/components/Table'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('metrics')
  const [currentRate, setCurrentRate] = useState<any>(null)
  const [newRate, setNewRate] = useState('')
  const [rateMessage, setRateMessage] = useState('')

  useEffect(() => {
    // Generate today's report for metrics
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/eod-report?startDate=${today}T00:00:00Z&endDate=${today}T23:59:59Z`)
      .then((r) => r.json())
      .then(setMetrics)
      .catch(console.error)

    // Get all clients with debt info
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(console.error)

    // Get purchases for supplier analysis
    fetch('/api/purchases')
      .then((r) => r.json())
      .then((data) => setPurchases(Array.isArray(data) ? data : []))
      .catch(console.error)

    // Get current price per kg
    fetch('/api/rates')
      .then((r) => r.json())
      .then((data) => setCurrentRate(data.latest))
      .catch(console.error)
  }, [])

  // Calculate supplier stats
  const supplierStats = (Array.isArray(purchases) ? purchases : []).reduce((acc: any, p: any) => {
    if (!acc[p.supplier.name]) {
      acc[p.supplier.name] = { count: 0, totalCost: 0, avgPrice: 0, lastPurchase: p.createdAt }
    }
    acc[p.supplier.name].count++
    acc[p.supplier.name].totalCost += p.total
    acc[p.supplier.name].avgPrice = (acc[p.supplier.name].totalCost / acc[p.supplier.name].count).toFixed(2)
    acc[p.supplier.name].lastPurchase = p.createdAt
    return acc
  }, {})

  // Find low inventory items
  const [inventory, setInventory] = useState([])
  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then((inv) => {
        const safeInv = Array.isArray(inv) ? inv : []
        const low = safeInv.filter((i: any) => i.fullStock < 20)
        setInventory(low)
      })
      .catch(console.error)
  }, [])

  // Calculate total debts
  const totalCylinderDebts = clients.reduce((sum: number, c: any) => {
    return sum + (c.totalOwedCylinders || 0)
  }, 0)

  const totalMoneyDebts = clients.reduce((sum: number, c: any) => {
    return sum + (c.totalOwedAmount || 0)
  }, 0)

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault()
    setRateMessage('')

    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate <= 0) {
      setRateMessage('✗ Please enter a valid positive rate')
      return
    }

    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate, note: `Updated at ${new Date().toLocaleString()}` })
      })

      if (!res.ok) throw new Error('Failed to update rate')
      const updated = await res.json()
      setCurrentRate(updated)
      setNewRate('')
      setRateMessage('✓ Rate updated successfully!')
    } catch (err: any) {
      setRateMessage(`✗ ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Revenue, profit, stock alerts, and supplier analysis</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
          {['metrics', 'suppliers', 'alerts', 'clients', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <p className="text-slate-600 text-sm font-medium">Today's Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">KES {(metrics?.sales?.totalRevenue ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <p className="text-slate-600 text-sm font-medium">Paid Amount</p>
              <p className="text-3xl font-bold text-green-600 mt-2">KES {(metrics?.sales?.paidAmount ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <p className="text-slate-600 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">KES {(metrics?.expenses?.total ?? 0).toFixed(2)}</p>
            </div>

            <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
              <p className="text-slate-600 text-sm font-medium">Net Cash (Today)</p>
              <p className="text-4xl font-bold text-blue-700 mt-2">KES {(metrics?.netCash ?? 0).toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Supplier Analysis Tab */}
        {activeTab === 'suppliers' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Supplier Analysis (30 Days)</h3>
            {Object.keys(supplierStats).length === 0 ? (
              <p className="text-slate-500">No supplier data yet</p>
            ) : (
              <Table
                columns={[
                  { header: 'Supplier', accessKey: 'name' },
                  { header: 'Purchases', accessKey: 'count' },
                  { header: 'Avg Price/KG', accessKey: 'avgPrice', render: (val) => `KES ${val}` },
                  { header: 'Total Cost', accessKey: 'totalCost', render: (val) => `KES ${val.toFixed(2)}` }
                ]}
                data={Object.entries(supplierStats).map(([name, data]: any) => ({
                  name,
                  ...data
                }))}
              />
            )}
          </div>
        )}

        {/* Stock Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Low Gas Stock Alert</h3>
              {inventory.length === 0 ? (
                <p className="text-red-700">All cylinders in good stock</p>
              ) : (
                <Table
                  columns={[
                    { header: 'Cylinder', accessKey: 'cylinderSizeId', render: (_, row) => row.cylinderSize?.label },
                    { header: 'Full', accessKey: 'fullStock' },
                    { header: 'Empty', accessKey: 'emptyStock' }
                  ]}
                  data={inventory}
                  emptyMessage="Good stock levels"
                />
              )}
            </div>

            <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-900 mb-4">💳 Client Debt Alert</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-amber-800">Total Cylinder Debt</span>
                  <span className="font-bold text-amber-900">{totalCylinderDebts} cylinders</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Total Money Debt</span>
                  <span className="font-bold text-amber-900">KES {totalMoneyDebts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Clients with Debt</span>
                  <span className="font-bold text-amber-900">{clients.filter((c: any) => c.totalOwedCylinders > 0).length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Client Ledger</h3>
            <Table
              columns={[
                { header: 'Name', accessKey: 'name' },
                { header: 'Type', accessKey: 'type' },
                { header: 'Cylinders Owed', accessKey: 'totalOwedCylinders' },
                { header: 'Money Owed', accessKey: 'totalOwedAmount', render: (val) => `KES ${val ? Number(val).toFixed(2) : '0.00'}` },
                {
                  header: 'Credit Status',
                  accessKey: 'creditStatus',
                  render: (_, row) =>
                    row.creditStatus && row.creditStatus.canDeliver ? (
                      <span className="text-green-600 font-medium">✓ OK</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ BLOCKED</span>
                    )
                }
              ]}
              data={clients}
              emptyMessage="No clients"
            />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold mb-6">Settings</h3>

            <div className="max-w-md">
              <h4 className="text-md font-medium text-slate-900 mb-4">💰 Price Per kg (KES)</h4>

              {rateMessage && (
                <div
                  className={`p-3 rounded mb-4 text-sm ${
                    rateMessage.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {rateMessage}
                </div>
              )}

              <form onSubmit={handleUpdateRate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Current Rate</label>
                  <p className="text-2xl font-bold text-blue-600">KES {currentRate?.rate || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Last updated: {currentRate?.effectiveAt ? new Date(currentRate.effectiveAt).toLocaleString() : 'Never'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Rate (KES/kg) *</label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="e.g., 85"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Update Rate
                </button>
              </form>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900 font-medium">ℹ️ How Pricing Works</p>
                <ul className="text-xs text-blue-800 mt-2 space-y-1">
                  <li>• Price per kg is set here by admin</li>
                  <li>• Sale total = Cylinder kg × Price per kg × Quantity</li>
                  <li>• Example: 13kg × 85 KES × 2 = 2,210 KES</li>
                  <li>• Prices update dynamically for all future sales</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
