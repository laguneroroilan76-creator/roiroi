const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/stats.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.get('/', getDashboardStats);

module.exports = router;
