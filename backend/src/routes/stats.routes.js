const express = require('express');
const router = express.Router();
const { getDashboardStats, getAnalyticsData } = require('../controllers/stats.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', getDashboardStats);
router.get('/analytics', getAnalyticsData);

module.exports = router;
