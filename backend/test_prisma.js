const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function test() {
  try {
    const userData = { email: 'test_prisma@test.com', password: 'Password!123', name: 'Test', role: 'User', canApprove: false, permissions: {} };
    const normalizedRole = 'User';
    const canApprove = false;
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const permissions = userData.permissions || {};
    
    const user = await prisma.user.create({
      data: {
        ...userData,
        role: normalizedRole,
        canApprove,
        permissions,
        password: hashedPassword
      }
    });
    console.log('Created user:', user);
  } catch(e) {
    console.error('Prisma Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
