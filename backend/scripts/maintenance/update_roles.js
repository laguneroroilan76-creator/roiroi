const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.updateMany({
    where: { canApprove: true },
    data: { role: 'Admin' }
  });
  console.log('Updated Admins');
  process.exit(0);
}

run();
