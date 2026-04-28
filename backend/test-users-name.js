const prisma = require('./src/config/database');
async function test() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ email: u.email, name: u.name })));
  prisma.$disconnect();
}
test();
