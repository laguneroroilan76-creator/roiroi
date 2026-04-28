const prisma = require('./src/config/database');
async function test() {
  const prf = await prisma.prf.findFirst();
  
  const payload = {
    ...prf,
    status: 'Approved',
    layout: {},
    items: [],
    // Add something that might exist in payload
    qty_0: '10'
  };
  
  const { id, createdAt, authorId, items, layout, author, type, displayType, ...rest } = payload;
  
  try {
    await prisma.prf.update({
      where: { id: parseInt(prf.id) },
      data: {
        ...rest,
        layout: layout || undefined,
        items: {
          create: items
        }
      }
    });
    console.log('Success!');
  } catch(e) {
    console.error('Update Failed!', e.message);
  }
  prisma.$disconnect();
}
test();
