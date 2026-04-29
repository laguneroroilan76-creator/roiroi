const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const VALID_ROLES = ['User', 'Admin', 'Driver', 'Guard'];

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role, 
      canApprove: user.canApprove,
      permissions: user.permissions
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
};

const register = async (userData) => {
  const normalizedRole = VALID_ROLES.includes(userData.role) ? userData.role : 'User';
  const canApprove = normalizedRole === 'Admin' ? true : (normalizedRole === 'User' && !!userData.canApprove);
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Default permissions if none provided
  const permissions = userData.permissions || {};

  return await prisma.user.create({
    data: {
      ...userData,
      role: normalizedRole,
      canApprove,
      permissions,
      password: hashedPassword
    }
  });
};

module.exports = { login, register };
