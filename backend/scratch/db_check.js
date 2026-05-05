const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.rrf.count();
    console.log('RRF count:', count);
    const first = await prisma.rrf.findFirst();
    console.log('First RRF:', first);
    process.exit(0);
  } catch (e) {
    console.error('Database Error:', e);
    process.exit(1);
  }
}

main();
