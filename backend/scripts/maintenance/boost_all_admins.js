const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'Admin' },
    data: {
      canApprove: true,
      canApprovePRF: true,
      canApproveTripTicket: true,
      canApproveRFP: true,
      canApproveDeptHead: true,
      canEndorse: true,
      canVerify: true,
    }
  });
  console.log(`✅ Boosted ${result.count} Admin users with full authority flags.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
