const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed hardware products...');

  try {
    // Check if products already exist
    const existingProducts = await prisma.product.findMany();
    console.log(`Found ${existingProducts.length} existing products`);

    // Add hardware products
    const hardwareProducts = [
      { name: 'Grill', type: 'HARDWARE' },
      { name: 'Regulator', type: 'HARDWARE' },
      { name: 'Burner', type: 'HARDWARE' },
      { name: 'Hose', type: 'HARDWARE' }
    ];

    for (const product of hardwareProducts) {
      // Check if this product already exists
      const existing = await prisma.product.findFirst({
        where: { name: product.name }
      });

      if (existing) {
        console.log(`✓ Product already exists: ${product.name}`);
      } else {
        const result = await prisma.product.create({
          data: product
        });
        console.log(`✓ Created product: ${result.name}`);
      }
    }

    console.log('✓ Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
