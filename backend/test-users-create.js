const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPwd = await bcrypt.hash('Test123!', 10);
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'testuser' },
      update: {},
      create: {
        email: 'testuser',
        password: hashedPwd,
        name: 'Test User',
        role: 'User'
      }
    });
    console.log('Test user created/exists:', user.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
