const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prfs = await prisma.prf.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, prfNo: true, status: true, approvedBy: true, requestor: true }
  });
  console.log('Recent RFPs (Prf model):');
  console.log(JSON.stringify(prfs, null, 2));

  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('\nRecent Users:');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
