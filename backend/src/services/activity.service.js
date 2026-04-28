const prisma = require('../config/database');

const logActivity = async (userId, action, resource, resourceId, details) => {
  try {
    if (userId === 0) return; // Don't log system admin bypass
    return await prisma.activityLog.create({
      data: { userId, action, resource, resourceId, details }
    });
  } catch (err) {
    console.error('Logging Error:', err);
  }
};

const getActivityLogs = async (includeUser = true, limit = 50) => {
  return await prisma.activityLog.findMany({
    include: includeUser ? { user: { select: { name: true, email: true } } } : false,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

const getUserActivityFeed = async (userId, canApprove) => {
  const where = canApprove ? {} : { userId };
  return await prisma.activityLog.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
};

module.exports = { logActivity, getActivityLogs, getUserActivityFeed };
