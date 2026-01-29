'use client'

import React, { useState, useEffect } from 'react'

interface InventoryTabulationFormProps {
  cylinderSizes: any[]
  onTabulated?: () => void
}

export function InventoryTabulationForm({ cylinderSizes, onTabulated }: InventoryTabulationFormProps) {
  const [inventory, setInventory] = useState<Record<number, { full: number; empty: number }>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('')

  useEffect(() => {
    // Initialize form with all cylinder sizes
    const init: Record<number, { full: number; empty: number }> = {}
    cylinderSizes.forEach((cs) => {
      init[cs.id] = { full: 0, empty: 0 }
    })
    setInventory(init)
  }, [cylinderSizes])

  const handleChange = (cylinderSizeId: number, field: 'full' | 'empty', value: string) => {
    setInventory((prev) => ({
      ...prev,
      [cylinderSizeId]: {
        ...prev[cylinderSizeId],
        [field]: parseInt(value) || 0
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('success')

    try {
      let successCount = 0
      let errorCount = 0

      for (const [cylinderSizeId, { full, empty }] of Object.entries(inventory)) {
        const res = await fetch('/api/inventory/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cylinderSizeId: parseInt(cylinderSizeId),
            fullStock: full,
            emptyStock: empty
          })
        })

        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (errorCount === 0) {
        setMessageType('success')
        setMessage(`✓ Successfully tabulated inventory for ${successCount} cylinder sizes`)
        onTabulated?.()
      } else {
        setMessageType('error')
        setMessage(`⚠ Partial success: ${successCount} updated, ${errorCount} failed`)
      }
    } catch (err: any) {
      setMessageType('error')
      setMessage(err.message || 'Error saving inventory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Initial Inventory Tabulation</h3>
        <p className="text-sm text-slate-600">
          Count and record the full and empty cylinders at the facility. This data will be used as the starting point.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-sm ${
            messageType === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-medium text-slate-700">Cylinder Size</th>
              <th className="text-right py-2 px-3 font-medium text-slate-700">Full Stock Count</th>
              <th className="text-right py-2 px-3 font-medium text-slate-700">Empty Stock Count</th>
            </tr>
          </thead>
          <tbody>
            {cylinderSizes.map((cs) => (
              <tr key={cs.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 font-medium text-slate-900">{cs.label}</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min="0"
                    value={inventory[cs.id]?.full || 0}
                    onChange={(e) => handleChange(cs.id, 'full', e.target.value)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                  />
                </td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min="0"
                    value={inventory[cs.id]?.empty || 0}
                    onChange={(e) => handleChange(cs.id, 'empty', e.target.value)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="submit"
        disabled={loading || cylinderSizes.length === 0}
        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-400"
      >
        {loading ? 'Saving Inventory...' : 'Save Inventory Counts'}
      </button>

      <p className="text-xs text-slate-500">
        After tabulation, inventory will be automatically updated as purchases arrive and sales are made.
      </p>
    </form>
  )
}
