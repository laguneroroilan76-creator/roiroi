const express = require('express');
const router = express.Router();
const { runConsistencyScan } = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { verifyOwnershipOrRole } = require('../middleware/idor.middleware'); // or write custom admin check

// Only Admins can run consistency scans
const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

router.get('/consistency-scan', authenticateToken, checkAdmin, runConsistencyScan);

module.exports = router;
