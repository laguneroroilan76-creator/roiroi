const prisma = require('../config/database');
const socket = require('../utils/socket');

exports.getActivities = async (req, res) => {
  try {
    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: { name: true, avatarUrl: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50 activities
    });

    res.json(activities);
  } catch (error) {
    console.error('Failed to get activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

exports.logActivity = async (userId, action, resource, resourceId, details = null) => {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details
      },
      include: {
        user: {
          select: { name: true, avatarUrl: true, role: true }
        }
      }
    });

    // Broadcast the new activity via socket
    const io = socket.getIO();
    io.emit('new_activity', activity);

    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
