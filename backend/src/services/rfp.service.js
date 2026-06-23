const prisma = require('../config/database');

const getRFPs = async (userId, canApprove, role) => {
  let where = {};
  
  if (role === 'Accounting') {
    where = {
      OR: [
        { status: { in: ['Approved', 'Completed', 'Received'] } },
        { status: { in: ['Cancelled', 'Disapproved'] }, archivedById: userId }
      ]
    };
  } else if (role === 'Guard' || canApprove) {
    where = {};
  } else {
    where = { authorId: userId };
  }
  return await prisma.rfp.findMany({
    where,
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Defense-in-depth: requestingUser is passed from the controller.
 */
const getRFPById = async (id, requestingUser) => {
  const rfp = await prisma.rfp.findUnique({
    where: { id: parseInt(id) },
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } }
  });

  if (!rfp) return null;

  if (requestingUser) {
    const isAdmin = requestingUser.role === 'Admin';
    const isAuthor = rfp.authorId === requestingUser.id;
    const hasFlag = !!(requestingUser.canApproveRFP || requestingUser.canApproveDeptHead || requestingUser.canApprove || requestingUser.role === 'Accounting');
    if (!isAdmin && !isAuthor && !hasFlag) {
      const err = new Error('Access denied: insufficient permissions.');
      err.statusCode = 403;
      throw err;
    }
  }

  return rfp;
};

const deleteRFP = async (id) => {
  return await prisma.rfp.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { getRFPs: getRFPs, getRFPById, deleteRFP };
