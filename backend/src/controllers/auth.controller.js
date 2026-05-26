const authService = require('../services/auth.service');
const { validatePassword } = require('../utils/validation');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
};


const getMe = async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, register, getMe };
