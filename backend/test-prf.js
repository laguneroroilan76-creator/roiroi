const prisma = require('./src/config/database');
async function test() {
  try {
    const prf = await prisma.prf.findFirst();
    if (!prf) { console.log('No PRF found'); return; }
    console.log('Found PRF:', prf.id);
    
    // Simulate updatePRF logic
    const data = {
      ...prf,
      status: 'Approved',
      layout: {},
      items: []
    };
    
    const { id, createdAt, authorId, items, layout, author, type, displayType, ...rest } = data;
    
    await prisma.$transaction(async (tx) => {
      await tx.prfItem.deleteMany({ where: { prfId: parseInt(prf.id) } });
      const updated = await tx.prf.update({
        where: { id: parseInt(prf.id) },
        data: {
          ...rest,
          layout: layout || undefined,
          items: {
            create: items
          }
        }
      });
      console.log('Update successful:', updated.status);
    });
  } catch (e) {
    console.error('Update failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
