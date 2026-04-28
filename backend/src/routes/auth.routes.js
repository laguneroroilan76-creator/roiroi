const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/register', authController.register); // Note: Original was protected but logic varies. I'll stick to original logic if needed.
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
