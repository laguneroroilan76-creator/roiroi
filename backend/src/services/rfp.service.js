const prisma = require('../config/database');

const getRFPs = async (userId, canApprove, role) => {
  let where = {};
  
  if (role === 'Accounting') {
    where = { status: { in: ['Approved', 'Completed'] } };
  } else if (role === 'Guard' || canApprove) {
    where = {};
  } else {
    where = { authorId: userId };
  }
  return await prisma.rrf.findMany({
    where,
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getRFPById = async (id) => {
  return await prisma.rrf.findUnique({
    where: { id: parseInt(id) },
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } }
  });
};

const deleteRFP = async (id) => {
  return await prisma.rrf.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { getRFPs: getRFPs, getRFPById, deleteRFP };
