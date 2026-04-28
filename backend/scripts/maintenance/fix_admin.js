const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const email = 'admin@test.com';
  const plainPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      password: hashedPassword,
      role: 'Admin',
      canApprove: true
    },
    create: {
      email,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'Admin',
      canApprove: true
    }
  });

  console.log(`Admin account (${email}) has been reset.`);
  console.log(`New Password: ${plainPassword}`);
  process.exit(0);
}

reset();
