'use client'

import React, { useState, useEffect } from 'react'
import { SalesForm } from '@/components/SalesForm'
import { ExpenseForm } from '@/components/ExpenseForm'
import { InventoryTabulationForm } from '@/components/InventoryTabulationForm'
import { Table } from '@/components/Table'

interface CylinderSize {
  id: number
  label: string
  kg: number
}

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([])
  const [cylinderSizes, setCylinderSizes] = useState<CylinderSize[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [eodReport, setEodReport] = useState<any>(null)
  const [isLoadingEOD, setIsLoadingEOD] = useState(false)
  const [activeTab, setActiveTab] = useState('sales')
  const [showTabulationPrompt, setShowTabulationPrompt] = useState(false)

  useEffect(() => {
    // Load clients
    fetch('/api/clients')
      .then((r) => r.json())
      .then(setClients)
      .catch(console.error)

    // Load inventory
    fetch('/api/inventory')
      .then((r) => r.json())
      .then((inv) => {
        setInventory(inv)
        // Check if any inventory has 0 stock (not tabulated)
        const hasUntabulatedInventory = inv.some((i: any) => i.fullStock === 0 && i.emptyStock === 0)
        setShowTabulationPrompt(hasUntabulatedInventory && inv.length > 0)
        // Extract unique cylinder sizes from inventory
        const sizes = inv.map((i: any) => i.cylinderSize)
        // Remove duplicates by id
        const uniqueSizes = Array.from(new Map(sizes.map((s: any) => [s.id, s])).values()) as CylinderSize[]
        setCylinderSizes(uniqueSizes)
      })
      .catch(console.error)

    // Load recent sales
    fetch('/api/sales')
      .then((r) => r.json())
      .then(setRecentSales)
      .catch(console.error)
  }, [])

  const handleSaleSubmit = async (data: any) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to record sale')
    }
    
    const newSale = await res.json()
    setRecentSales([newSale, ...recentSales])
    
    // Reload inventory
    const invRes = await fetch('/api/inventory')
    setInventory(await invRes.json())
  }

  const handleExpenseSubmit = async (data: any) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to record expense')
  }

  const handleCloseDay = async () => {
    setIsLoadingEOD(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/eod-report?startDate=${today}T00:00:00Z&endDate=${today}T23:59:59Z`)
      const report = await res.json()
      setEodReport(report)
      setActiveTab('eod')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingEOD(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Staff / Manager Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage sales, inventory, and end-of-day reports</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {['sales', 'expenses', 'tabulate', 'inventory', 'eod'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              } ${tab === 'tabulate' && showTabulationPrompt ? 'text-orange-600 border-orange-200' : ''}`}
            >
              {tab === 'eod'
                ? 'EOD Report'
                : tab === 'tabulate'
                  ? `Tabulate ${showTabulationPrompt ? '⚠️' : ''}`
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <SalesForm onSubmit={handleSaleSubmit} clients={clients} cylinderSizes={cylinderSizes} />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
                <Table
                  columns={[
                    { header: 'Client', accessKey: 'clientName', render: (val, row) => val || row.client?.name || 'Walk-in' },
                    { header: 'Cylinder', accessKey: 'cylinderSizeId', render: (_, row) => row.cylinderSize?.label || 'N/A' },
                    { header: 'Qty', accessKey: 'quantity' },
                    { header: 'Status', accessKey: 'paymentStatus' },
                    { header: 'Amount', accessKey: 'total', render: (val) => `KES ${val.toFixed(2)}` }
                  ]}
                  data={recentSales.slice(0, 10)}
                  emptyMessage="No sales yet"
                />
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="max-w-2xl">
            <ExpenseForm onSubmit={handleExpenseSubmit} />
          </div>
        )}

        {/* Inventory Tabulation Tab */}
        {activeTab === 'tabulate' && (
          <div className="max-w-4xl">
            <InventoryTabulationForm
              cylinderSizes={cylinderSizes}
              onTabulated={() => {
                setShowTabulationPrompt(false)
                // Reload inventory
                fetch('/api/inventory')
                  .then((r) => r.json())
                  .then(setInventory)
                  .catch(console.error)
              }}
            />
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
            <Table
              columns={[
                { header: 'Cylinder Size', accessKey: 'cylinderSizeId', render: (_, row) => row.cylinderSize?.label },
                { header: 'Full Stock', accessKey: 'fullStock' },
                { header: 'Empty Stock', accessKey: 'emptyStock' },
                {
                  header: 'Status',
                  accessKey: 'fullStock',
                  render: (val) => {
                    if (val < 10) return <span className="text-red-600 font-medium">Low Stock ⚠️</span>
                    return <span className="text-green-600">OK</span>
                  }
                }
              ]}
              data={inventory}
              emptyMessage="No inventory data"
            />
          </div>
        )}

        {/* EOD Report Tab */}
        {activeTab === 'eod' && (
          <div>
            <button
              onClick={handleCloseDay}
              disabled={isLoadingEOD}
              className="mb-6 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-400"
            >
              {isLoadingEOD ? 'Generating...' : 'Generate EOD Report'}
            </button>

            {eodReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-lg mb-4">Sales Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Sales</span>
                      <span className="font-medium">KES {eodReport.sales.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paid</span>
                      <span className="font-medium text-green-600">KES {eodReport.sales.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Unpaid</span>
                      <span className="font-medium text-red-600">KES {eodReport.sales.unpaidAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-lg mb-4">Expenses</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Expenses</span>
                      <span className="font-medium">KES {eodReport.expenses.total.toFixed(2)}</span>
                    </div>
                    {Object.entries(eodReport.expenses.breakdown).map(([type, amount]: [string, any]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-slate-600">{type.replace(/_/g, ' ')}</span>
                        <span>KES {amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-lg mb-4">Net Cash</h4>
                  <div className="text-4xl font-bold text-green-700">KES {eodReport.netCash.toFixed(2)}</div>
                  <p className="text-sm text-slate-600 mt-2">Paid Amount - Total Expenses</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
