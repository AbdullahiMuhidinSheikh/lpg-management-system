'use client'

import React from 'react'

interface TableColumn {
  header: string
  accessKey: string
  render?: (value: any, row: any) => React.ReactNode
}

interface TableProps {
  columns: TableColumn[]
  data: any[]
  className?: string
  emptyMessage?: string
}

export function Table({ columns, data, className = '', emptyMessage = 'No data' }: TableProps) {
  const safeColumns = Array.isArray(columns) ? columns : []
  const safeData = Array.isArray(data) ? data : []
  return (
    <div className={`overflow-x-auto border border-slate-200 rounded-lg ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr>
            {safeColumns.map((col) => (
              <th
                key={col.accessKey}
                className="px-4 py-3 text-left font-semibold text-slate-700"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td colSpan={safeColumns.length || 1} className="px-4 py-6 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            safeData.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                {safeColumns.map((col) => (
                  <td key={col.accessKey} className="px-4 py-3 text-slate-800">
                    {col.render ? col.render(row[col.accessKey], row) : row[col.accessKey]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
