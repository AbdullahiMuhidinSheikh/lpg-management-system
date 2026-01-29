'use client'

import React, { useState } from 'react'

interface ExpenseFormProps {
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function ExpenseForm({ onSubmit, isLoading = false }: ExpenseFormProps) {
  const [form, setForm] = useState({
    type: 'FUEL',
    amount: '',
    note: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.amount) {
      setError('Amount is required')
      return
    }

    try {
      await onSubmit({
        ...form,
        amount: parseFloat(form.amount)
      })
      setSuccess('Expense recorded!')
      setForm({ type: 'FUEL', amount: '', note: '' })
    } catch (err: any) {
      setError(err.message || 'Error recording expense')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold">Log Expense</h3>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expense Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="FUEL">Fuel</option>
            <option value="CASUAL_LABOR">Casual Labor</option>
            <option value="REPAIRS">Repairs</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Optional note..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 disabled:bg-slate-400"
      >
        {isLoading ? 'Recording...' : 'Log Expense'}
      </button>
    </form>
  )
}
