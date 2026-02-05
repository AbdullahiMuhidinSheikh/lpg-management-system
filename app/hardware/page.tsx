'use client'

import React, { useState, useEffect } from 'react'
import { Table } from '@/components/Table'

export default function HardwareTracking() {
  const [hardware, setHardware] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [newHardwareForm, setNewHardwareForm] = useState({ serial: '', productId: '', status: 'IN_STOCK' })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHardware()
    loadProducts()
  }, [])

  const loadHardware = async () => {
    try {
      const res = await fetch('/api/hardware')
      const data = await res.json()
      setHardware(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setHardware([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setProducts([])
    }
  }

  const handleAddHardware = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!newHardwareForm.serial || !newHardwareForm.productId) {
      setMessage('Serial and Product are required')
      return
    }

    try {
      const res = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newHardwareForm,
          productId: parseInt(newHardwareForm.productId)
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add hardware')
      setMessage('✓ Hardware added successfully!')
      setNewHardwareForm({ serial: '', productId: '', status: 'IN_STOCK' })
      await loadHardware()
    } catch (err: any) {
      setMessage(`✗ ${err.message}`)
    }
  }

  const filteredHardware = hardware.filter((h: any) => {
    if (activeTab === 'all') return true
    return h.status === activeTab
  })

  const stats = {
    total: hardware.length,
    inStock: hardware.filter((h: any) => h.status === 'IN_STOCK').length,
    assigned: hardware.filter((h: any) => h.status === 'ASSIGNED').length,
    lost: hardware.filter((h: any) => h.status === 'LOST').length,
    maintenance: hardware.filter((h: any) => h.status === 'MAINTENANCE').length
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Hardware Tracking</h1>
          <p className="text-slate-600 mt-1">Track expensive items (grills, regulators) by serial number</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-green-700">In Stock</p>
            <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">Assigned</p>
            <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-700">Maintenance</p>
            <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-xs text-red-700">Lost</p>
            <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
          </div>
        </div>

        {/* Add Hardware Form */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Register New Hardware</h3>
          {message && (
            <div
              className={`p-3 rounded mb-4 text-sm ${message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
            >
              {message}
            </div>
          )}
          <form onSubmit={handleAddHardware} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number *</label>
              <input
                type="text"
                value={newHardwareForm.serial}
                onChange={(e) => setNewHardwareForm({ ...newHardwareForm, serial: e.target.value })}
                required
                placeholder="e.g., SN-2024-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Type *</label>
              <select
                value={newHardwareForm.productId}
                onChange={(e) => setNewHardwareForm({ ...newHardwareForm, productId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">-- Select a Product --</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={newHardwareForm.status}
                onChange={(e) => setNewHardwareForm({ ...newHardwareForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Register
              </button>
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
          {['all', 'IN_STOCK', 'ASSIGNED', 'MAINTENANCE', 'LOST'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'All' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Hardware Table */}
        {isLoading ? (
          <p className="text-slate-600">Loading...</p>
        ) : (
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <Table
              columns={[
                { header: 'Serial Number', accessKey: 'serial' },
                { header: 'Product', accessKey: 'productId', render: (_, row) => row.product?.name || 'Unknown' },
                { header: 'Status', accessKey: 'status', render: (val) => <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-medium">{val.replace(/_/g, ' ')}</span> },
                { header: 'Client', accessKey: 'clientId', render: (_, row) => row.client?.name || 'In Stock' },
                { header: 'Date Added', accessKey: 'createdAt', render: (val) => new Date(val).toLocaleDateString() }
              ]}
              data={filteredHardware}
              emptyMessage="No hardware found"
            />
          </div>
        )}
      </div>
    </div>
  )
}
