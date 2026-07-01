const prisma = require('../config/database');

const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await prisma.auditTrail.findMany({
      skip,
      take: parseInt(limit),
      orderBy: { id: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    const total = await prisma.auditTrail.count();

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAuditLogs
};
