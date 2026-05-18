const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.tripTicket.findMany();
  const prfs = await prisma.prf.findMany();
  const rrfs = await prisma.rrf.findMany();

  console.log('--- Trip Tickets ---');
  tickets.forEach(t => console.log(`ID: ${t.id}, Status: ${t.status}`));
  
  console.log('--- PRFs ---');
  prfs.forEach(p => console.log(`ID: ${p.id}, Status: ${p.status}`));

  console.log('--- RFPs (RRFs) ---');
  rrfs.forEach(r => console.log(`ID: ${r.id}, Status: ${r.status}`));

  await prisma.$disconnect();
}

main();
