#!/usr/bin/env node

/**
 * System verification script - tests core workflows
 * Run: node test-workflows.js (after npm run dev)
 */

const BASE_URL = 'http://localhost:3000/api'

async function test(name, fn) {
  try {
    await fn()
    console.log(`✓ ${name}`)
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`)
  }
}

async function main() {
  console.log('LPG Inventory System - Workflow Tests\n')

  // Test 1: Get inventory
  await test('GET inventory', async () => {
    const res = await fetch(`${BASE_URL}/inventory`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Expected array')
    console.log(`  → Found ${data.length} cylinder sizes`)
  })

  // Test 2: Get clients
  await test('GET clients', async () => {
    const res = await fetch(`${BASE_URL}/clients`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Expected array')
    console.log(`  → Found ${data.length} clients`)
  })

  // Test 3: Get rate
  await test('GET current rate', async () => {
    const res = await fetch(`${BASE_URL}/rates`)
    const data = await res.json()
    console.log(`  → Rate: KES ${data.latest.rate}/kg`)
  })

  // Test 4: Create sale
  await test('POST sale (client 1, cylinder 1, qty 5)', async () => {
    const res = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 1,
        cylinderSizeId: 1,
        quantity: 5,
        deliveryType: 'DELIVERY',
        paymentStatus: 'PAID'
      })
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    console.log(`  → Sale ID: ${data.id}, Amount: KES ${data.total}`)
  })

  // Test 5: Record expense
  await test('POST expense (Fuel, 500)', async () => {
    const res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'FUEL',
        amount: 500,
        note: 'Vehicle fuel'
      })
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    console.log(`  → Expense ID: ${data.id}`)
  })

  // Test 6: Get client debt
  await test('GET client 1 debt ledger', async () => {
    const res = await fetch(`${BASE_URL}/cylinder-returns?clientId=1`)
    const data = await res.json()
    console.log(`  → Found ${data.length} debt records`)
  })

  // Test 7: Record empty return
  await test('POST empty return (client 1, cylinder 1, qty 3)', async () => {
    const res = await fetch(`${BASE_URL}/cylinder-returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 1,
        cylinderSizeId: 1,
        emptyQuantity: 3
      })
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    console.log(`  → Debt: ${data.debt} cylinders (issued ${data.issuedFull} - returned ${data.returnedEmpty})`)
  })

  // Test 8: EOD Report
  await test('GET EOD report (today)', async () => {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`${BASE_URL}/eod-report?startDate=${today}T00:00:00Z&endDate=${today}T23:59:59Z`)
    const data = await res.json()
    console.log(`  → Revenue: KES ${data.sales.totalRevenue}, Expenses: KES ${data.expenses.total}, Net: KES ${data.netCash}`)
  })

  // Test 9: Get purchases
  await test('GET purchases', async () => {
    const res = await fetch(`${BASE_URL}/purchases`)
    const data = await res.json()
    console.log(`  → Found ${data.length} purchase records`)
  })

  // Test 10: Get hardware
  await test('GET hardware', async () => {
    const res = await fetch(`${BASE_URL}/hardware`)
    const data = await res.json()
    console.log(`  → Found ${data.length} hardware items`)
  })

  console.log('\n✓ All core workflows tested!')
  console.log('\nNext: Visit http://localhost:3000 in your browser\n')
}

main().catch(console.error)
