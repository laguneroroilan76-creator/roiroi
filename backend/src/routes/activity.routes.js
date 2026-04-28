const express = require('express');
const router = express.Router();
const activityService = require('../services/activity.service');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const logs = await activityService.getUserActivityFeed(req.user.id, req.user.canApprove);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await activityService.getActivityLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
