import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add cylinder sizes
  const sizes = [
    { label: '6kg', kg: 6, isPlastic: false },
    { label: '13kg (Metal)', kg: 13, isPlastic: false },
    { label: '13kg (Plastic)', kg: 13, isPlastic: true },
    { label: '35kg', kg: 35, isPlastic: false },
    { label: '45kg', kg: 45, isPlastic: false },
    { label: '50kg', kg: 50, isPlastic: false }
  ]

  for (const s of sizes) {
    await prisma.product.upsert({
      where: { name: `${s.label} Cylinder` },
      update: {},
      create: {
        name: `${s.label} Cylinder`,
        type: 'GAS',
        cylinderSizes: {
          create: { label: s.label, kg: s.kg, isPlastic: s.isPlastic }
        }
      },
    })
  }

  // initial rate per kg (e.g., 75 KES per kg)
  await prisma.ratePerKg.create({ data: { rate: 75, note: 'Initial seed rate (KES per kg)' } })

  // sample inventory rows
  const allSizes = await prisma.cylinderSize.findMany()
  for (const cs of allSizes) {
    await prisma.inventory.upsert({
      where: { cylinderSizeId: cs.id },
      update: {},
      create: { cylinderSizeId: cs.id, fullStock: 100, emptyStock: 20 }
    })
  }

  // sample clients
  await prisma.client.createMany({
    data: [
      { name: 'ABC Retail Store', type: 'RETAIL', creditLimitAmount: 10000, creditLimitCylinders: 10 },
      { name: 'XYZ Restaurant', type: 'RETAIL', creditLimitAmount: 5000, creditLimitCylinders: 5 },
      { name: 'John Smith (Individual)', type: 'INDIVIDUAL', creditLimitAmount: null, creditLimitCylinders: null }
    ],
    skipDuplicates: true
  })

  // sample suppliers
  await prisma.supplier.createMany({
    data: [
      { name: 'National Gas Ltd' },
      { name: 'City Petro Co' },
      { name: 'Regional Energy' }
    ],
    skipDuplicates: true
  })

  // sample users (staff and manager)
  await prisma.user.createMany({
    data: [
      { email: 'staff@lpg.com', name: 'Staff User', role: 'STAFF' },
      { email: 'manager@lpg.com', name: 'Manager', role: 'MANAGER' },
      { email: 'admin@lpg.com', name: 'Admin Boss', role: 'ADMIN' }
    ],
    skipDuplicates: true
  })

  // hardware products (for tracking expensive items)
  await prisma.product.createMany({
    data: [
      { name: 'Grill', type: 'HARDWARE' },
      { name: 'Regulator', type: 'HARDWARE' },
      { name: 'Burner', type: 'HARDWARE' },
      { name: 'Hose', type: 'HARDWARE' }
    ],
    skipDuplicates: true
  })

  console.log('Seed finished.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
