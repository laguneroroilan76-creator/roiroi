const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rfps = await prisma.rrf.findMany();
  console.log(JSON.stringify(rfps, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
