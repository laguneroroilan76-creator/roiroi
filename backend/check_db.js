const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tripTickets = await prisma.tripTicket.findMany();
  console.log('Trip Tickets:', tripTickets);
  const prfs = await prisma.prf.findMany();
  console.log('PRFs:', prfs);
}
check();
