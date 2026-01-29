import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 flex items-center justify-center gap-3">
            <img src="/gas-cylinder.svg" alt="LPG" className="w-12 h-12" />
            LPG Inventory System
          </h1>
          <p className="text-xl text-slate-600 mt-2">Manage cylinder stock, sales, debts, and margins in real-time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Sales Card */}
          <Link href="/dashboard" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition">
              <div className="text-3xl mb-3">📊</div>
              <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Sales Dashboard</h2>
              <p className="text-slate-600 mt-2">Record sales, log expenses, and generate EOD reports</p>
            </div>
          </Link>

          {/* Admin Card */}
          <Link href="/admin" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition">
              <div className="text-3xl mb-3">👨‍💼</div>
              <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Admin Dashboard</h2>
              <p className="text-slate-600 mt-2">View metrics, alerts, and client credit status</p>
            </div>
          </Link>

          {/* Ledger Card */}
          <Link href="/ledger" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition">
              <div className="text-3xl mb-3">📋</div>
              <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Cylinder Ledger</h2>
              <p className="text-slate-600 mt-2">Track issued vs. returned cylinders per client</p>
            </div>
          </Link>

          {/* Suppliers Card */}
          <Link href="/suppliers" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition">
              <div className="text-3xl mb-3">💰</div>
              <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Suppliers</h2>
              <p className="text-slate-600 mt-2">Compare supplier prices and 30-day trends</p>
            </div>
          </Link>

          {/* Hardware Card */}
          <Link href="/hardware" className="group">
            <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition">
              <div className="text-3xl mb-3">🔧</div>
              <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Hardware Tracking</h2>
              <p className="text-slate-600 mt-2">Track serial numbers for grills, regulators, burners</p>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="bg-white p-8 rounded-lg border border-slate-200 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Inventory Management</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Full vs. Empty cylinder tracking</li>
                <li>✓ 6 cylinder sizes supported</li>
                <li>✓ Low stock alerts</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Client Debts</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Issued vs. returned tracking</li>
                <li>✓ Credit limits (money + cylinders)</li>
                <li>✓ Delivery blocking on debt</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Financial Analytics</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Daily revenue reports</li>
                <li>✓ Supplier cost comparison</li>
                <li>✓ Profit calculations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-blue-50 p-8 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Getting Started</h2>
          <ol className="space-y-3 text-sm text-blue-900">
            <li><strong>1. Database Setup:</strong> Configure PostgreSQL in <code className="bg-blue-100 px-2 py-1 rounded">.env</code></li>
            <li><strong>2. Migrations:</strong> Run <code className="bg-blue-100 px-2 py-1 rounded">npm run prisma:migrate</code></li>
            <li><strong>3. Seed Data:</strong> Run <code className="bg-blue-100 px-2 py-1 rounded">npm run seed</code></li>
            <li><strong>4. Start Server:</strong> Run <code className="bg-blue-100 px-2 py-1 rounded">npm run dev</code></li>
          </ol>
          <p className="text-sm text-blue-800 mt-4">See <strong>README.md</strong> for detailed documentation</p>
        </div>
      </div>
    </main>
  )
}
