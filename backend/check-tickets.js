const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check current trip tickets
    const tickets = await prisma.tripTicket.findMany({
      select: { id: true, requestorName: true, authorId: true, createdAt: true }
    });
    
    console.log('Current Trip Tickets:');
    tickets.forEach(t => {
      console.log(`ID: ${t.id}, Requestor: ${t.requestorName}, AuthorID: ${t.authorId}, Created: ${t.createdAt}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
