const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.tripTicket.findMany({
    select: {
      id: true,
      dateTimeDeparture: true,
      dateTimeReturn: true,
      status: true
    }
  });
  console.log(JSON.stringify(tickets, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
