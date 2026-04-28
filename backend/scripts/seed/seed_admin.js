const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin';
  const password = 'Admin123!';
  const name = 'System Administrator';

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name: name
      },
      create: {
        email,
        password: hashedPassword,
        name: name
      },
    });
    console.log('Admin account created/updated successfully:', user.email);
  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
