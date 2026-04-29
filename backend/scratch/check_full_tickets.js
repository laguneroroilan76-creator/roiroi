const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tickets = await prisma.tripTicket.findMany();
  console.log('Full Tickets:', JSON.stringify(tickets, null, 2));
  process.exit(0);
}

check();
