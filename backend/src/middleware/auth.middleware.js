const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
  process.exit(1);
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    
    try {
      const prisma = require('../config/database');
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      
      if (!user) return res.status(401).json({ error: 'User not found' });

      // Normalize user role and permissions for runtime checks.
      const normalizedRole = ['Admin', 'Driver', 'Guard', 'User', 'Accounting'].includes(user.role)
        ? user.role
        : 'User';
      user.role = normalizedRole;
      user.canApprove = normalizedRole === 'Admin' ? true : (normalizedRole === 'User' && !!user.canApprove);
      req.user = user;
      next();
    } catch (dbErr) {
      console.error('Auth Middleware DB Error:', dbErr);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

module.exports = { authenticateToken };
