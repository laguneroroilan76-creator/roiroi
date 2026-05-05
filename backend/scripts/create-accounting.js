const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'accounting@test.com';
  const password = await bcrypt.hash('Admin123!', 10);
  const name = 'Accounting Dept';
  const role = 'Accounting';

  const user = await prisma.user.upsert({
    where: { email },
    update: { role, password, name },
    create: {
      email,
      password,
      name,
      role,
      canApprove: false,
      permissions: {}
    }
  });

  console.log('Accounting user created/updated:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
