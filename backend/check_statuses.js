const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.tripTicket.findMany({
    select: { id: true, status: true, dateTimeDeparture: true, dateTimeReturn: true, requestorName: true }
  });
  console.log('Tickets:', tickets);
}

main().catch(console.error).finally(() => prisma.$disconnect());
