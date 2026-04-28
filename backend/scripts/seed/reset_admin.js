const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdmin() {
  const hashedPassword = await bcrypt.hash('admin', 10);
  try {
    await prisma.user.upsert({
      where: { email: 'admin' },
      update: { password: hashedPassword, canApprove: true },
      create: {
        email: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        canApprove: true
      }
    });
    await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: { password: hashedPassword, canApprove: true },
      create: {
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Admin',
        canApprove: true
      }
    });
    console.log('Admin users reset successfully');
  } catch (err) {
    console.error('Error resetting admin:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
