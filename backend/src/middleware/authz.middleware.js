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

    // Ensure the model name is exactly what Prisma expects (e.g. prf, rrf, tripTicket)
    // Sometimes Model can be passed as 'Prf', 'Rrf', 'TripTicket', so we lowerCamelCase it for Prisma.
    let modelName = Model.charAt(0).toLowerCase() + Model.slice(1);
    
    // Quick map for models that don't directly match
    if (modelName === 'prf') modelName = 'prf';
    if (modelName === 'rrf') modelName = 'rrf';
    if (modelName === 'tripTicket') modelName = 'tripTicket';

    const record = await prisma[modelName].findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const isAuthor = record.authorId === req.user.id;
    const hasRole = roles.includes(req.user.role);

    // In this app, users with generic specific boolean flags can also bypass if they have it
    // For example, if it's TripTicket, `canApproveTripTicket` implies they have Approver power.
    // However, it's safer to stick to explicit roles or we can let the controller do the secondary check
    // if they pass this. Wait, verifyOwnershipOrRole handles the *primary* authorization check.
    // We should allow Admin as a default.
    const isAdmin = req.user.role === 'Admin';

    if (isAdmin || hasRole || isAuthor) {
      req.record = record; // Pass record to next middleware/controller
      return next();
    }

    return res.status(403).json({ error: 'Ownership unauthorized' });
  } catch (error) {
    console.error('Authorization Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error during authorization' });
  }
};

module.exports = { verifyRole, verifyOwnershipOrRole };
