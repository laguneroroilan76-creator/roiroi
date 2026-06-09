const authService = require('../services/auth.service');
const { validatePassword } = require('../utils/validation');
const { sanitizeUser } = require('../utils/userUtils');
const prisma = require('../config/database');
const auditService = require('../services/audit.service');
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    await prisma.$transaction(async (tx) => {
      await auditService.log(tx, {
        userId: result.user.id,
        action: 'LOGIN',
        tableName: 'User',
        recordId: result.user.id,
        ipAddress: req.ip
      });
    });

    res.json({ user: result.user, message: 'Logged in successfully' });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        await prisma.$transaction(async (tx) => {
          await auditService.log(tx, {
            userId: decoded.id,
            action: 'LOGOUT',
            tableName: 'User',
            recordId: decoded.id,
            ipAddress: req.ip
          });
        });
      } catch (e) {
        // ignore invalid token for logout auditing
      }
    }

    res.clearCookie('token', {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
      secure: process.env.NODE_ENV === 'production'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const register = async (req, res, next) => {
  try {
    // Only Admins can create new user accounts
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can register new users.' });
    }

    const { email, password, name, role, canApprove, permissions } = req.body;
    
    const error = validatePassword(password);
    if (error) return res.status(400).json({ error });

    const user = await authService.register({ email, password, name, role, canApprove, permissions });
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};


const getMe = async (req, res) => {
  try {
    const prisma = require('../config/database');
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

module.exports = { login, register, getMe, logout };
