const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { 
      id: true, name: true, role: true,
      status: true, inactiveReason: true
    }
  });
  console.log(users.filter(u => u.role === 'Driver'));
}
main().finally(() => prisma.$disconnect());
