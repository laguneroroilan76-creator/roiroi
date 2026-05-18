const userService = require('../services/user.service');
const activityService = require('../services/activity.service');
const imageUtils = require('../utils/image.js');
const bcrypt = require('bcryptjs');
const path = require('path');

const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGuardUsers = async (req, res) => {
  try {
    const guards = await userService.getGuardUsers();
    res.json(guards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSignature = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const pngFilename = req.file.filename.replace(path.extname(req.file.filename), '.png');
    const pngPath = path.join(path.dirname(filePath), pngFilename);

    await imageUtils.processSignatureTransparency(filePath, pngPath);

    const signatureUrl = `/uploads/signatures/${pngFilename}`;
    await userService.updateUserProfile(req.user.id, { signatureUrl });

    res.json({ message: 'Signature updated!', signatureUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await userService.updateUserProfile(req.user.id, { avatarUrl });
    res.json({ message: 'Avatar updated!', avatarUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTheme = async (req, res) => {
  try {
    const { themeColor } = req.body;
    await userService.updateUserProfile(req.user.id, { themeColor });
    res.json({ message: 'Theme updated!', themeColor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDarkMode = async (req, res) => {
  try {
    const { isDarkMode } = req.body;
    const user = await userService.updateUserProfile(req.user.id, { isDarkMode: !!isDarkMode });
    res.json({ message: 'Display updated!', isDarkMode: user.isDarkMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    if (!req.user.canApprove) return res.status(403).json({ error: 'Forbidden' });
    const logs = await activityService.getActivityLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActivityFeed = async (req, res) => {
  try {
    const logs = await activityService.getUserActivityFeed(req.user.id, req.user.canApprove);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserData = async (req, res) => {
  try {
    // Only Admins or canApprove users can update other users' data
    if (!req.user.canApprove) return res.status(403).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const data = { ...req.body };
    if (data.password === '') delete data.password;
    
    // Hash password if it's being updated
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Only Admins can change roles — prevent canApprove users from privilege escalation
    if (data.role !== undefined && req.user.role !== 'Admin') {
      delete data.role;
    }

    const user = await userService.updateUser(id, data);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
    
    const { id } = req.params;

    // Prevent Admin from deleting their own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    await userService.deleteUser(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { 
  getUsers, getGuardUsers, updateSignature, updateAvatar, updateTheme, 
  updateDarkMode, getActivityLogs, getActivityFeed, updateUserData, deleteUser
};
