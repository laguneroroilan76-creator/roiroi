const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const updated = await prisma.tripTicket.update({
      where: { id: 14 },
      data: { archivedBy: 'Admin (System Fix)' }
    });
    console.log('Updated Record 14:', updated.id);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
