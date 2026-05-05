const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('--- DATABASE DIAGNOSTICS ---');
  try {
    const userCount = await prisma.user.count();
    console.log('User Count:', userCount);

    const ticketCount = await prisma.tripTicket.count();
    console.log('Trip Ticket Count:', ticketCount);

    const prfCount = await prisma.prf.count();
    console.log('PRF Count:', prfCount);

    const rrfCount = await prisma.rrf.count();
    console.log('RRF Count:', rrfCount);

    if (userCount > 0) {
      const users = await prisma.user.findMany({ take: 5, select: { email: true, role: true } });
      console.log('Sample Users:', users);
    }

  } catch (err) {
    console.error('DATABASE ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
