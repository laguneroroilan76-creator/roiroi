const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Rate limit: max 20 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public: login (rate-limited)
router.post('/login', loginLimiter, authController.login);

// Protected: register — Admin only
router.post('/register', authenticateToken, authController.register);

// Protected: get current user
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
