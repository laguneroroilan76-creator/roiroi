const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
  process.exit(1);
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Normalize user role and permissions for runtime checks.
    const normalizedRole = ['Admin', 'Driver', 'Guard', 'User', 'Accounting'].includes(user.role)
      ? user.role
      : 'User';
    
    const isAdmin = normalizedRole === 'Admin';
    
    // Populate authority flags - Admins always true, Users check their specific flags
    const populatedUser = {
      ...user,
      role: normalizedRole,
      canApprove: isAdmin || !!user.canApprove,
      canApprovePRF: isAdmin || !!user.canApprovePRF,
      canApproveTripTicket: isAdmin || !!user.canApproveTripTicket,
      canApproveRFP: isAdmin || !!user.canApproveRFP,
      canApproveDeptHead: isAdmin || !!user.canApproveDeptHead,
      canEndorse: isAdmin || !!user.canEndorse,
      canVerify: isAdmin || !!user.canVerify
    };

    req.user = populatedUser;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { authenticateToken };

