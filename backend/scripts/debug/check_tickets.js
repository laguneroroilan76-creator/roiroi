const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tickets = await prisma.tripTicket.findMany();
  console.log('Tickets:', tickets.map(t => t.id));
  process.exit(0);
}

check();
