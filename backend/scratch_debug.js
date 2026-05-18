const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prfs = await prisma.prf.findMany({
    include: { items: true }
  });
  console.log('PRFs in DB:', JSON.stringify(prfs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
