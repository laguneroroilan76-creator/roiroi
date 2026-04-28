const prisma = require('../config/database');

const createRRF = async (userId, rrfData) => {
  const { items, layout, ...rest } = rrfData;
  return await prisma.rrf.create({
    data: {
      ...rest,
      layout: layout || null,
      authorId: userId,
      items: {
        create: items
      }
    }
  });
};

const getRRFs = async (userId, canApprove) => {
  const where = canApprove ? {} : { authorId: userId };
  return await prisma.rrf.findMany({
    where,
    include: { items: true, author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getRRFById = async (id) => {
  return await prisma.rrf.findUnique({
    where: { id: parseInt(id) },
    include: { items: true }
  });
};

const updateRRF = async (id, data) => {
  // Destructure to remove fields that don't exist in Prisma model or are immutable
  const { 
    id: _id, 
    createdAt, 
    authorId, 
    items, 
    layout, 
    author, 
    type, 
    displayType, 
    requestorName,
    docType,
    ...rest 
  } = data;
  
  // Use a transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    await tx.rrfItem.deleteMany({ where: { rrfId: parseInt(id) } });
    return await tx.rrf.update({
      where: { id: parseInt(id) },
      data: {
        ...rest,
        layout: layout || undefined,
        items: {
          create: items
        }
      }
    });
  });
};

const deleteRRF = async (id) => {
  return await prisma.rrf.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createRRF, getRRFs, getRRFById, updateRRF, deleteRRF };
