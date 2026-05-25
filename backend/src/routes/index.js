const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
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

module.exports = router;
