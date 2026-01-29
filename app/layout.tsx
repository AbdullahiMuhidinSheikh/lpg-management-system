import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'LPG Inventory & Debt Management',
  description: 'Manage LPG cylinder inventory, sales, and client debts'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  )
}
