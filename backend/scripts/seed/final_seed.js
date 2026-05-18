const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = [
    { email: 'admin', name: 'System Admin' },
    { email: 'admin@hdi.com', name: 'HDI Administrator' },
    { email: 'admin@teravibe.com', name: 'Teravibe Admin' },
    { email: 'intern_it', name: 'IT Intern' },
    { email: 'admin@test.com', name: 'Test Admin' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: hashedPassword,
        name: u.name,
        role: 'Admin',
        canApprove: true,
        canApprovePRF: true,
        canApproveTripTicket: true,
        canApproveRFP: true,
        canApproveDeptHead: true,
        canEndorse: true,
        canVerify: true,
      },
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: 'Admin',
        canApprove: true,
        canApprovePRF: true,
        canApproveTripTicket: true,
        canApproveRFP: true,
        canApproveDeptHead: true,
        canEndorse: true,
        canVerify: true,
      }
    });
    console.log(`Seeded user: ${u.email}`);
  }

  await prisma.$disconnect();
}

main();
