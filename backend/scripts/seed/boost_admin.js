const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin';
  const user = await prisma.user.update({
    where: { email },
    data: {
      role: 'Admin',
      canApprove: true,
      canApprovePRF: true,
      canApproveTripTicket: true,
      canApproveRFP: true,
      canApproveDeptHead: true,
      canEndorse: true,
      canVerify: true,
      permissions: {
        tripTicket: { view: true, create: true, edit: true, delete: true },
        prf: { view: true, create: true, edit: true, delete: true },
        rrf: { view: true, create: true, edit: true, delete: true },
        history: { view: true },
        support: { view: true },
        archived: { view: true },
        vehicles: { view: true },
        users: { view: true }
      }
    }
  });
  console.log('✅ User "admin" boosted to Super Admin:', user.email);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
