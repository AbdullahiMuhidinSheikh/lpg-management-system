'use client'

import React, { useState, useEffect } from 'react'

interface SalesFormProps {
  onSubmit: (data: any) => Promise<void>
  clients: any[]
  cylinderSizes: any[]
  isLoading?: boolean
}

export function SalesForm({ onSubmit, clients, cylinderSizes, isLoading = false }: SalesFormProps) {
  const [form, setForm] = useState({
    clientName: '',
    cylinderSizeId: '',
    quantity: 1,
    notes: '',
    deliveryType: 'DELIVERY',
    paymentStatus: 'PAID'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pricePerKg, setPricePerKg] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    // Fetch current price per kg from admin settings
    fetch('/api/rates')
      .then((r) => r.json())
      .then((data) => {
        // API returns shape { latest, history }
        const rate = data?.latest?.rate
        if (typeof rate === 'number') {
          setPricePerKg(rate)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    // Calculate total price based on cylinder size and price per kg
    const selectedSize = cylinderSizes.find((cs) => cs.id === parseInt(form.cylinderSizeId))
    if (selectedSize && pricePerKg > 0) {
      setTotalPrice(selectedSize.kg * pricePerKg * form.quantity)
    } else {
      setTotalPrice(0)
    }
  }, [form.cylinderSizeId, form.quantity, pricePerKg, cylinderSizes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.clientName.trim()) {
      setError('Client name is mandatory')
      return
    }

    try {
      await onSubmit({
        ...form,
        cylinderSizeId: parseInt(form.cylinderSizeId),
        quantity: parseInt(form.quantity)
      })
      setSuccess('Sale recorded successfully!')
      setForm({ clientName: '', cylinderSizeId: '', quantity: 1, notes: '', deliveryType: 'DELIVERY', paymentStatus: 'PAID' })
    } catch (err: any) {
      setError(err.message || 'Error recording sale')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold">Record Sale</h3>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
          <input
            type="text"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            required
            placeholder="e.g., ABC Retail Store"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cylinder Size *</label>
          <select
            value={form.cylinderSizeId}
            onChange={(e) => setForm({ ...form, cylinderSizeId: e.target.value })}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">-- Select --</option>
            {cylinderSizes.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
            required
            min="1"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Type</label>
          <select
            value={form.deliveryType}
            onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="DELIVERY">Delivery</option>
            <option value="PICKUP">Pickup</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
          <select
            value={form.paymentStatus}
            onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional notes about this sale"
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
        <div>
          <p className="text-sm text-slate-600">Price per kg (KES)</p>
          <p className="text-lg font-semibold text-slate-900">{pricePerKg.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Cylinder Weight</p>
          <p className="text-lg font-semibold text-slate-900">
            {form.cylinderSizeId
              ? cylinderSizes.find((cs) => cs.id === parseInt(form.cylinderSizeId))?.kg || 0
              : 0}{' '}
            kg
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Total Price (KES)</p>
          <p className="text-lg font-semibold text-blue-600">{totalPrice.toFixed(2)}</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400"
      >
        {isLoading ? 'Recording...' : 'Record Sale'}
      </button>
    </form>
  )
}
