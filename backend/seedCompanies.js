const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = [
    { name: 'HDI' },
    { name: 'Capital' },
    { name: 'Adventures' }
  ];

  for (const c of companies) {
    await prisma.company.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }
  console.log('Companies seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
