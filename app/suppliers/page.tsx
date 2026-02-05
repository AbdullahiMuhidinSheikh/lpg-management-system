'use client'

import React, { useState, useEffect } from 'react'
import { Table } from '@/components/Table'

interface SupplierStats {
  name: string
  totalPurchases: number
  totalCost: number
  avgPricePerKg: string
  bySize: Record<string, any>
}

export default function SupplierPriceTrends() {
  const [purchases, setPurchases] = useState([])
  const [supplierStats, setSupplierStats] = useState<Record<string, SupplierStats>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/purchases')
      .then((r) => r.json())
      .then((data) => {
        const safePurchases = Array.isArray(data) ? data : []
        setPurchases(safePurchases)
        calculateStats(safePurchases)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoading(false)
      })
  }, [])

  const calculateStats = (purchases: any[]) => {
    if (!Array.isArray(purchases)) {
      setSupplierStats({})
      return
    }
    const stats: any = {}

    purchases.forEach((p: any) => {
      const supplierName = p.supplier.name
      const cylinderLabel = p.cylinderSize.label

      if (!stats[supplierName]) {
        stats[supplierName] = {
          name: supplierName,
          totalPurchases: 0,
          totalCost: 0,
          avgPricePerKg: 0,
          bySize: {}
        }
      }

      if (!stats[supplierName].bySize[cylinderLabel]) {
        stats[supplierName].bySize[cylinderLabel] = {
          purchases: 0,
          totalCost: 0,
          avgPrice: 0
        }
      }

      stats[supplierName].totalPurchases++
      stats[supplierName].totalCost += p.total
      stats[supplierName].avgPricePerKg = (stats[supplierName].totalCost / stats[supplierName].totalPurchases).toFixed(2)

      stats[supplierName].bySize[cylinderLabel].purchases++
      stats[supplierName].bySize[cylinderLabel].totalCost += p.total
      stats[supplierName].bySize[cylinderLabel].avgPrice = (stats[supplierName].bySize[cylinderLabel].totalCost / stats[supplierName].bySize[cylinderLabel].purchases).toFixed(2)
    })

    setSupplierStats(stats)
  }

  // Find cheapest supplier overall
  const cheapestSupplier: SupplierStats | null = Object.values(supplierStats).reduce((cheapest: SupplierStats | null, current: SupplierStats) => {
    if (!cheapest || parseFloat(current.avgPricePerKg) < parseFloat(cheapest.avgPricePerKg)) {
      return current
    }
    return cheapest
  }, null)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Supplier Price Trends</h1>
          <p className="text-slate-600 mt-1">Compare supplier costs to optimize purchasing</p>
        </div>

        {isLoading && <p className="text-slate-600">Loading...</p>}

        {!isLoading && (
          <>
            {/* Cheapest Supplier Alert */}
            {cheapestSupplier && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 mb-6">
                <p className="text-sm font-medium text-green-800">💰 Best Price Award</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{cheapestSupplier.name}</p>
                <p className="text-sm text-green-700 mt-1">Avg. KES {cheapestSupplier.avgPricePerKg}/kg</p>
              </div>
            )}

            {/* Supplier Comparison */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
              <h2 className="text-lg font-semibold mb-4">Supplier Overview</h2>
              <Table
                columns={[
                  { header: 'Supplier', accessKey: 'name' },
                  { header: 'Total Purchases', accessKey: 'totalPurchases' },
                  { header: 'Total Cost', accessKey: 'totalCost', render: (val) => `KES ${val.toFixed(2)}` },
                  {
                    header: 'Avg Price/KG',
                    accessKey: 'avgPricePerKg',
                    render: (val) => (
                      <span className={`font-semibold ${val === cheapestSupplier?.avgPricePerKg ? 'text-green-600' : 'text-slate-900'}`}>
                        KES {val}
                      </span>
                    )
                  }
                ]}
                data={Object.values(supplierStats)}
                emptyMessage="No supplier data"
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(supplierStats).map(([supplierName, data]: any) => (
                <div key={supplierName} className="bg-white p-6 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold mb-4">{supplierName}</h3>
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Cost</span>
                      <span className="font-medium">KES {data.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Avg Price/KG</span>
                      <span className="font-bold">KES {data.avgPricePerKg}</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-700 mb-3 mt-6">By Cylinder Size</h4>
                  <div className="space-y-2">
                    {Object.entries(data.bySize).map(([sizeLabel, sizeData]: any) => (
                      <div key={sizeLabel} className="flex justify-between text-sm bg-slate-50 p-2 rounded">
                        <span className="text-slate-700">{sizeLabel}</span>
                        <span className="font-medium">KES {sizeData.avgPrice}/kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Purchase History */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 mt-6">
              <h2 className="text-lg font-semibold mb-4">Purchase History</h2>
              <Table
                columns={[
                  { header: 'Supplier', accessKey: 'supplierId', render: (_, row) => row.supplier.name },
                  { header: 'Cylinder', accessKey: 'cylinderSizeId', render: (_, row) => row.cylinderSize.label },
                  { header: 'Qty', accessKey: 'quantity' },
                  { header: 'Price/KG', accessKey: 'pricePerKg', render: (val) => `KES ${val.toFixed(2)}` },
                  { header: 'Total', accessKey: 'total', render: (val) => `KES ${val.toFixed(2)}` },
                  {
                    header: 'Date',
                    accessKey: 'createdAt',
                    render: (val) => new Date(val).toLocaleDateString()
                  }
                ]}
                data={purchases}
                emptyMessage="No purchases"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
