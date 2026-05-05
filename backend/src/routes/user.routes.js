const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadSignature, uploadAvatar } = require('../middleware/upload.middleware');

router.use(authenticateToken);

router.get('/', userController.getUsers);
router.get('/guards', userController.getGuardUsers);
router.post('/profile/avatar', uploadAvatar.single('avatar'), userController.updateAvatar);
router.post('/profile/theme', userController.updateTheme);
router.post('/profile/darkmode', userController.updateDarkMode);

// Logs & Feed
router.get('/activity-logs', userController.getActivityLogs);
router.get('/activity-feed', userController.getActivityFeed);

// Admin / User Management
router.put('/:id', userController.updateUserData);
router.delete('/:id', userController.deleteUser);

module.exports = router;
