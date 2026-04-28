const prisma = require('./src/config/database');
async function test() {
  const u = await prisma.user.findUnique({where: {email: 'admin@test.com'}});
  console.log('canApprove:', u.canApprove);
  const prfs = await prisma.prf.findMany();
  console.log('total prfs:', prfs.length);
  prisma.$disconnect();
}
test();
