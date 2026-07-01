const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, auditController.getAuditLogs);

module.exports = router;
