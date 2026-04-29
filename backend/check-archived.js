const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const tickets = await prisma.tripTicket.findMany({
      where: { status: 'Archived' },
      select: { id: true, requestorName: true, archivedBy: true }
    });
    console.log('Archived Tickets:', JSON.stringify(tickets, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
