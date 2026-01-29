const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting complete seed...');

  try {
    // Clear existing data in correct order
    console.log('Clearing existing data...');
    await prisma.hardwareSerial.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.cylinderDebt.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.cylinderSize.deleteMany();
    await prisma.product.deleteMany();
    await prisma.ratePerKg.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await prisma.supplier.deleteMany();
    
    console.log('✓ Cleared all data');

    // Add cylinder sizes and products
    const sizes = [
      { label: '6kg', kg: 6, isPlastic: false },
      { label: '13kg (Metal)', kg: 13, isPlastic: false },
      { label: '13kg (Plastic)', kg: 13, isPlastic: true },
      { label: '35kg', kg: 35, isPlastic: false },
      { label: '45kg', kg: 45, isPlastic: false },
      { label: '50kg', kg: 50, isPlastic: false }
    ];

    for (const s of sizes) {
      const product = await prisma.product.create({
        data: {
          name: `${s.label} Cylinder`,
          type: 'GAS'
        }
      });

      const cylinderSize = await prisma.cylinderSize.create({
        data: {
          label: s.label,
          kg: s.kg,
          isPlastic: s.isPlastic,
          productId: product.id
        }
      });

      // Create inventory for each cylinder size (starting with 0 stock - to be tabulated by staff)
      await prisma.inventory.create({
        data: {
          cylinderSizeId: cylinderSize.id,
          fullStock: 0,
          emptyStock: 0
        }
      });

      console.log(`✓ Created ${s.label} cylinder (stock: 0/0 - pending staff tabulation)`);
    }

    // Initial rate per kg
    await prisma.ratePerKg.create({
      data: { rate: 75, note: 'Initial seed rate (KES per kg)' }
    });
    console.log('✓ Created initial rate per kg: 75 KES');

    // Sample clients
    const clientsData = [
      { name: 'ABC Retail Store', type: 'RETAIL', creditLimitAmount: 10000, creditLimitCylinders: 10 },
      { name: 'XYZ Restaurant', type: 'RETAIL', creditLimitAmount: 5000, creditLimitCylinders: 5 },
      { name: 'John Smith (Individual)', type: 'INDIVIDUAL', creditLimitAmount: null, creditLimitCylinders: null }
    ];
    
    for (const client of clientsData) {
      await prisma.client.create({ data: client });
    }
    console.log('✓ Created 3 sample clients');

    // Sample suppliers
    const suppliersData = [
      { name: 'National Gas Ltd' },
      { name: 'City Petro Co' },
      { name: 'Regional Energy' }
    ];
    
    for (const supplier of suppliersData) {
      await prisma.supplier.create({ data: supplier });
    }
    console.log('✓ Created 3 sample suppliers');

    // Sample users
    const usersData = [
      { email: 'staff@lpg.com', name: 'Staff User', role: 'STAFF' },
      { email: 'manager@lpg.com', name: 'Manager', role: 'MANAGER' },
      { email: 'admin@lpg.com', name: 'Admin Boss', role: 'ADMIN' }
    ];
    
    for (const user of usersData) {
      await prisma.user.create({ data: user });
    }
    console.log('✓ Created 3 sample users');

    // Hardware products
    const hardwareData = [
      { name: 'Grill', type: 'HARDWARE' },
      { name: 'Regulator', type: 'HARDWARE' },
      { name: 'Burner', type: 'HARDWARE' },
      { name: 'Hose', type: 'HARDWARE' }
    ];
    
    for (const hardware of hardwareData) {
      await prisma.product.create({ data: hardware });
    }
    console.log('✓ Created 4 hardware products');

    console.log('\n✅ Complete seed finished successfully!');
    
    // Show summary
    const cylinderCount = await prisma.cylinderSize.count();
    const inventoryCount = await prisma.inventory.count();
    const clientCount = await prisma.client.count();
    
    console.log(`\nDatabase Summary:`);
    console.log(`- Cylinder sizes: ${cylinderCount}`);
    console.log(`- Inventory items: ${inventoryCount} (all initialized with 0 stock)`);
    console.log(`- Clients: ${clientCount}`);
    console.log(`\n⚠️  IMPORTANT: Staff must tabulate initial stock in the Inventory section before recording sales/purchases!`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
