const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const prfs = await prisma.prf.findMany();
  console.log('PRFs Raw:', JSON.stringify(prfs, null, 2));
  process.exit();
}

check();
