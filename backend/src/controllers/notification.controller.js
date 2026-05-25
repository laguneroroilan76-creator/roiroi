const prisma = require('../config/database');
const socket = require('../utils/socket');

exports.getNotifications = async (req, res) => {
  try {
    const user = req.user;
    
    // Build query based on user's role and permissions
    let roleOrConditions = [];
    
    // Include broadcast notifications that the user is allowed to see
    if (user.role === 'Admin') roleOrConditions.push({ targetRole: 'Admin' });
    if (user.role === 'IT') roleOrConditions.push({ targetRole: 'IT' });
    if (user.canApprove) roleOrConditions.push({ targetRole: 'Approver' });
    if (user.canApprovePRF) roleOrConditions.push({ targetRole: 'PRF_Approver' });
    if (user.canApproveRFP) roleOrConditions.push({ targetRole: 'RFP_Approver' });
    if (user.canApproveTripTicket) roleOrConditions.push({ targetRole: 'TripTicket_Approver' });
    if (user.canApproveDeptHead) roleOrConditions.push({ targetRole: 'DeptHead' });
    
    // The query logic: 
    // notifications where targetUserId == user.id OR targetRole is in roleOrConditions
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetUserId: user.id },
          ...roleOrConditions
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50 notifications
    });

    res.json(notifications);
  } catch (error) {
    console.error('Failed to get notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    res.json(notification);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const user = req.user;
    
    let roleOrConditions = [];
    if (user.role === 'Admin') roleOrConditions.push({ targetRole: 'Admin' });
    if (user.role === 'IT') roleOrConditions.push({ targetRole: 'IT' });
    if (user.canApprove) roleOrConditions.push({ targetRole: 'Approver' });
    if (user.canApprovePRF) roleOrConditions.push({ targetRole: 'PRF_Approver' });
    if (user.canApproveRFP) roleOrConditions.push({ targetRole: 'RFP_Approver' });
    if (user.canApproveTripTicket) roleOrConditions.push({ targetRole: 'TripTicket_Approver' });
    if (user.canApproveDeptHead) roleOrConditions.push({ targetRole: 'DeptHead' });

    await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [
          { targetUserId: user.id },
          ...roleOrConditions
        ]
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

exports.createNotification = async (data) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        message: data.message,
        type: data.type || 'INFO',
        link: data.link || null,
        targetRole: data.targetRole || null,
        targetUserId: data.targetUserId || null
      }
    });

    // Emit via socket
    const io = socket.getIO();
    io.emit('new_notification', notification);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
