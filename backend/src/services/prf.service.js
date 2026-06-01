const prisma = require('../config/database');

const getPRFs = async (userId, canApprove, isGuard = false) => {
  const where = (canApprove || isGuard) ? {} : { authorId: userId };
  return await prisma.prf.findMany({
    where,
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getPRFById = async (id) => {
  return await prisma.prf.findUnique({
    where: { id: parseInt(id) },
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } }
  });
};

const deletePRF = async (id) => {
  return await prisma.prf.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { getPRFs, getPRFById, deletePRF };
