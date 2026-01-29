'use client'

import React, { useState, useEffect } from 'react'
import { Table } from '@/components/Table'

export default function CylinderLedger() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emptyReturnForm, setEmptyReturnForm] = useState({ cylinderSizeId: '', quantity: 1 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((cs) => {
        setClients(cs.filter((c: any) => c.type === 'RETAIL'))
      })
      .catch(console.error)
  }, [])

  const handleSelectClient = async (clientId: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/clients?id=${clientId}`)
      const client = await res.json()
      setSelectedClient(client)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnEmpty = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!emptyReturnForm.cylinderSizeId) {
      setMessage('Select a cylinder size')
      return
    }

    try {
      const res = await fetch('/api/cylinder-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          cylinderSizeId: parseInt(emptyReturnForm.cylinderSizeId),
          emptyQuantity: parseInt(emptyReturnForm.quantity)
        })
      })

      if (!res.ok) throw new Error('Failed to record return')
      const updated = await res.json()
      setMessage(`✓ Recorded ${updated.returnedEmpty} empty cylinders. ${updated.message}`)
      setEmptyReturnForm({ cylinderSizeId: '', quantity: 1 })

      // Reload client
      await handleSelectClient(selectedClient.id)
    } catch (err: any) {
      setMessage(`✗ Error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Cylinder Ledger (Retail)</h1>
          <p className="text-slate-600 mt-1">Track issued vs. returned cylinders per client</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Retail Clients</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clients.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectClient(c.id)}
                  className={`w-full text-left px-4 py-2 rounded transition ${
                    selectedClient?.id === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                  {c.totalOwedCylinders > 0 && <span className="text-xs ml-2">({c.totalOwedCylinders})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-3">
            {isLoading && <p className="text-slate-600">Loading...</p>}

            {selectedClient && !isLoading && (
              <>
                {/* Header */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedClient.name}</h2>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-slate-600 text-sm">Total Cylinders Owed</p>
                      <p className="text-2xl font-bold text-red-600">{selectedClient.totalOwedCylinders}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Money Owed</p>
                      <p className="text-2xl font-bold text-orange-600">KES {selectedClient.totalOwedAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Delivery Status</p>
                      <p className={`text-lg font-bold ${selectedClient.creditStatus.canDeliver ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedClient.creditStatus.canDeliver ? '✓ Can Deliver' : '✗ BLOCKED'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cylinder Debt Table */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Cylinder Debt by Size</h3>
                  <Table
                    columns={[
                      { header: 'Cylinder Size', accessKey: 'cylinderSizeId', render: (_, row) => row.cylinderSize?.label },
                      { header: 'Issued', accessKey: 'issuedFull' },
                      { header: 'Returned', accessKey: 'returnedEmpty' },
                      {
                        header: 'Owed',
                        accessKey: 'issuedFull',
                        render: (_, row) => {
                          const debt = row.issuedFull - row.returnedEmpty
                          return <span className={debt > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{debt}</span>
                        }
                      }
                    ]}
                    data={selectedClient.cylinderDebts}
                    emptyMessage="No cylinder history"
                  />
                </div>

                {/* Return Empty Form */}
                <form onSubmit={handleReturnEmpty} className="bg-white p-6 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold mb-4">Record Empty Cylinder Return</h3>

                  {message && (
                    <div className={`p-3 rounded mb-4 text-sm ${message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cylinder Size *</label>
                      <select
                        value={emptyReturnForm.cylinderSizeId}
                        onChange={(e) => setEmptyReturnForm({ ...emptyReturnForm, cylinderSizeId: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">-- Select --</option>
                        {selectedClient.cylinderDebts.map((d: any) => (
                          <option key={d.cylinderSizeId} value={d.cylinderSizeId}>
                            {d.cylinderSize?.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Qty Empty *</label>
                      <input
                        type="number"
                        value={emptyReturnForm.quantity}
                        onChange={(e) => setEmptyReturnForm({ ...emptyReturnForm, quantity: parseInt(e.target.value) || 1 })}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                      >
                        Record Return
                      </button>
                    </div>
                  </div>
                </form>

                {/* Recent Sales */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
                  <Table
                    columns={[
                      { header: 'Cylinder', accessKey: 'cylinderSizeId', render: (_, row) => row.cylinderSize?.label },
                      { header: 'Qty', accessKey: 'quantity' },
                      { header: 'Status', accessKey: 'paymentStatus' },
                      { header: 'Amount', accessKey: 'total', render: (val) => `KES ${val.toFixed(2)}` },
                      {
                        header: 'Date',
                        accessKey: 'createdAt',
                        render: (val) => new Date(val).toLocaleDateString()
                      }
                    ]}
                    data={selectedClient.sales}
                    emptyMessage="No sales"
                  />
                </div>
              </>
            )}

            {!selectedClient && !isLoading && <p className="text-slate-600">Select a client to view details</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
