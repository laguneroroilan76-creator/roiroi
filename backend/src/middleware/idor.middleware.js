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
      if (req.user.role === 'Admin' || req.user.departmentRole === 'President') {
        return next();
      }

      // We need to look up the record's authorId
      const selectFields = { authorId: true, approvedById: true };
      if (modelName === 'tripTicket') {
        selectFields.endorsedById = true;
      }
      if (modelName === 'prf') {
        selectFields.verifiedById = true;
      }

      const record = await prisma[modelName].findUnique({
        where: { id },
        select: selectFields
      });

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      // If they are the author, they have access
      if (record.authorId === req.user.id) {
        return next();
      }

      // If they are the expected endorser or approver, they have access
      if (record.endorsedById === req.user.id ||
          record.approvedById === req.user.id ||
          record.verifiedById === req.user.id) {
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
