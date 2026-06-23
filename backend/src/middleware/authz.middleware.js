const prisma = require('../config/database');

const verifyRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Role unauthorized' });
  }
  next();
};

const verifyOwnershipOrRole = (Model, roles) => async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID parameter' });

    // Normalise to lowerCamelCase for Prisma client access
    let modelName = Model.charAt(0).toLowerCase() + Model.slice(1);

    const record = await prisma[modelName].findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const user = req.user;
    const isAdmin = user.role === 'Admin';
    const isAuthor = record.authorId === user.id;

    // Check actual DB roles (not phantom strings like 'Approver' / 'Verifier')
    const hasExplicitRole = roles.includes(user.role);

    // Check boolean permission flags per document type.
    // These are populated by auth.middleware from the live DB record on every request.
    let hasPermissionFlag = false;
    if (modelName === 'prf') {
      hasPermissionFlag = !!(user.canApprovePRF || user.canVerify || user.canApprove);
    } else if (modelName === 'rfp') {
      hasPermissionFlag = !!(user.canApproveRFP || user.canApproveDeptHead || user.canApprove || user.role === 'Accounting');
    } else if (modelName === 'tripTicket') {
      hasPermissionFlag = !!(user.canApproveTripTicket || user.canEndorse || user.canApprove || user.role === 'Guard');
    }

    if (isAdmin || isAuthor || hasExplicitRole || hasPermissionFlag) {
      req.record = record; // Pass the pre-fetched record to the controller
      return next();
    }

    return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
  } catch (error) {
    console.error('Authorization Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error during authorization' });
  }
};

module.exports = { verifyRole, verifyOwnershipOrRole };
