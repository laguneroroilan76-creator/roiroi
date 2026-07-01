const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Limit each IP to 300 requests per `window` to support SPA navigation
});
const ticketRoutes = require('./ticket.routes');
const prfRoutes = require('./prf.routes');
const rfpRoutes = require('./rfp.routes');
const reminderRoutes = require('./reminder.routes');
const taskRoutes = require('./task.routes');
const activityRoutes = require('./activity.routes');

const driverRoutes = require('./driver.routes');
const vehicleRoutes = require('./vehicle.routes');
const supportRoutes = require('./support.routes');
const notificationRoutes = require('./notification.routes');
const statsRoutes = require('./stats.routes');
const auditRoutes = require('./audit.routes');
const adminRoutes = require('./admin.routes');
const companyRoutes = require('./company.routes');
const departmentRoutes = require('./department.routes');

// Apply general rate limit to all /api routes below this router
router.use(generalApiLimiter);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trip-tickets', ticketRoutes);
router.use('/prfs', prfRoutes);
router.use('/rfps', rfpRoutes);
router.use('/reminders', reminderRoutes);
router.use('/tasks', taskRoutes);
router.use('/activity', activityRoutes);
router.use('/drivers', driverRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/support', supportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);
router.use('/audit', auditRoutes);
router.use('/admin', adminRoutes);
router.use('/companies', companyRoutes);
router.use('/departments', departmentRoutes);

module.exports = router;
