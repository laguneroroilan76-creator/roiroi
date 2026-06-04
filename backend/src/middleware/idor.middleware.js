/**
 * idor.middleware.js
 * Insecure Direct Object Reference (IDOR) protection.
 */
const prisma = require('../config/database');

const verifyOwnershipOrRole = (modelName) => {
  return async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID format' });

      // If user is Admin, they can access anything
      if (req.user.role === 'Admin') {
        return next();
      }

      // We need to look up the record's authorId
      const record = await prisma[modelName].findUnique({
        where: { id },
        select: { authorId: true }
      });

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      // If they are the author, they have access
      if (record.authorId === req.user.id) {
        return next();
      }

      // If they are an Approver (or have specific approve flags), they have access
      if (req.user.role === 'Approver' || req.user.canApprove || req.user.canApprovePRF || req.user.canApproveRFP || req.user.canApproveTripTicket || req.user.role === 'Accounting' || req.user.role === 'Guard') {
        return next();
      }

      // Access Denied
      return res.status(403).json({ error: 'Access denied: insufficient permissions to access this resource.' });
    } catch (err) {
      console.error('IDOR check failed:', err);
      return res.status(500).json({ error: 'Internal server error during authorization check.' });
    }
  };
};

module.exports = { verifyOwnershipOrRole };
