const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rrf = await prisma.rrf.findUnique({ where: { id: 1 } });
  if (rrf) {
    const layout = JSON.parse(rrf.layout);
    layout.receivedBy = "";
    layout.receivedDate = "";
    await prisma.rrf.update({
      where: { id: 1 },
      data: {
        receivedBy: null,
        receivedDate: null,
        layout: JSON.stringify(layout)
      }
    });
    console.log('Reset RFP 1 successfully!');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
