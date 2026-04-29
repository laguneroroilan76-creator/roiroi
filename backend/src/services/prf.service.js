const prisma = require('../config/database');

const createPRF = async (userId, prfData) => {
  const { items, layout, ...rest } = prfData;
  return await prisma.prf.create({
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

const getPRFs = async (userId, canApprove, isGuard = false) => {
  const where = (canApprove || isGuard) ? {} : { authorId: userId };
  return await prisma.prf.findMany({
    where,
    include: { items: true, author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getPRFById = async (id) => {
  return await prisma.prf.findUnique({
    where: { id: parseInt(id) },
    include: { items: true }
  });
};

const updatePRF = async (id, data) => {
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
    await tx.prfItem.deleteMany({ where: { prfId: parseInt(id) } });
    return await tx.prf.update({
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

const deletePRF = async (id) => {
  return await prisma.prf.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createPRF, getPRFs, getPRFById, updatePRF, deletePRF };
