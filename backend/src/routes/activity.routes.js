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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const logs = await activityService.getActivityLogs(true, skip, limit);
    const totalCount = await activityService.getActivityLogsCount();

    res.json({
      logs,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
