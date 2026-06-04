const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

// Public: login (rate-limited)
router.post('/login', loginLimiter, authController.login);

// Public: logout
router.post('/logout', authController.logout);

// Protected: register — Admin only
router.post('/register', authenticateToken, loginLimiter, authController.register);

// Protected: get current user
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
