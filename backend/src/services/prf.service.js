const prisma = require('../config/database');

const getPRFs = async (userId, canApprove, isGuard = false) => {
  const where = (canApprove || isGuard) ? {} : { authorId: userId };
  return await prisma.prf.findMany({
    where,
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Defense-in-depth: requestingUser is passed from the controller so the service
 * can independently verify access even if middleware is bypassed due to a future
 * route misconfiguration.
 */
const getPRFById = async (id, requestingUser) => {
  const prf = await prisma.prf.findUnique({
    where: { id: parseInt(id) },
    include: { items: true, author: { select: { name: true, avatarUrl: true, company: true } }, preparedBy: { select: { name: true } }, verifiedBy: { select: { name: true } }, approvedBy: { select: { name: true } } }
  });

  if (!prf) return null;

  // Service-layer access control (defense-in-depth)
  if (requestingUser) {
    const isAdmin = requestingUser.role === 'Admin';
    const isAuthor = prf.authorId === requestingUser.id;
    const hasFlag = !!(requestingUser.canApprovePRF || requestingUser.canVerify || requestingUser.canApprove || requestingUser.role === 'Accounting');
    if (!isAdmin && !isAuthor && !hasFlag) {
      const err = new Error('Access denied: insufficient permissions.');
      err.statusCode = 403;
      throw err;
    }
  }

  return prf;
};

const deletePRF = async (id) => {
  return await prisma.prf.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { getPRFs, getPRFById, deletePRF };

