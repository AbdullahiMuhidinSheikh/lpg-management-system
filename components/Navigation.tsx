'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/dashboard', label: 'Sales', icon: '📊' },
    { href: '/admin', label: 'Admin', icon: '👨‍💼' },
    { href: '/ai-dashboard', label: 'AI', icon: '🤖' },
    { href: '/ledger', label: 'Ledger', icon: '📋' },
    { href: '/suppliers', label: 'Suppliers', icon: '💰' },
    { href: '/hardware', label: 'Hardware', icon: '🔧' }
  ]

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <img src="/gas-cylinder.svg" alt="LPG" className="w-7 h-7" />
            LPG Inventory System
          </Link>
          <div className="flex gap-2 flex-wrap justify-end">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
