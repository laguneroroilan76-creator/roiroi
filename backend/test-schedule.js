const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing getDriverSchedule query...');
    const tickets = await prisma.tripTicket.findMany({
      where: {
        status: { in: ['Approved', 'Completed'] }
      },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Success! Found tickets:', tickets.length);
  } catch (err) {
    console.error('DATABASE ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
