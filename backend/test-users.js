const prisma = require('./src/config/database');
async function test() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => u.email).join(', '));
  prisma.$disconnect();
}
test();
