const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.upsertReminder);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
