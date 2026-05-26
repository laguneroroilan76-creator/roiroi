const prisma = require('../config/database');
const socket = require('../utils/socket');

const logActivity = async (userId, action, resource, resourceId, details) => {
  try {
    if (userId === 0) return; // Don't log system admin bypass
    const activity = await prisma.activityLog.create({
      data: { userId, action, resource, resourceId, details },
      include: { user: { select: { name: true, email: true, avatarUrl: true } } }
    });

    try {
      const io = socket.getIO();
      io.emit('new_activity', activity);
    } catch (err) {
      console.log('Socket not initialized yet or error:', err);
    }

    return activity;
  } catch (err) {
    console.error('Logging Error:', err);
  }
};

const getActivityLogs = async (includeUser = true, limit = 50) => {
  return await prisma.activityLog.findMany({
    include: includeUser ? { user: { select: { name: true, email: true, avatarUrl: true } } } : false,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

const getUserActivityFeed = async (userId, canApprove) => {
  const where = canApprove ? {} : { userId };
  return await prisma.activityLog.findMany({
    where,
    include: { user: { select: { name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
};

module.exports = { logActivity, getActivityLogs, getUserActivityFeed };
