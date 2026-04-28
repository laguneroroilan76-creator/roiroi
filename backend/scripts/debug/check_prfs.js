const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const prfs = await prisma.prf.findMany({
    include: { author: true }
  });
  console.log('PRFs:', prfs.map(p => ({
    id: p.id,
    requestor: p.requestor,
    authorName: p.author?.name,
    authorId: p.authorId
  })));
  process.exit();
}

check();
