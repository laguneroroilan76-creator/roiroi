const prisma = require('../config/database');

const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: { 
      id: true, email: true, name: true, createdAt: true, 
      canApprove: true, role: true, avatarUrl: true, 
      themeColor: true, isDarkMode: true 
    }
  });
};

const getGuardUsers = async () => {
  return await prisma.user.findMany({
    where: { role: 'Guard' },
    select: { id: true, name: true }
  });
};

const updateUserProfile = async (userId, data) => {
  return await prisma.user.update({
    where: { id: userId },
    data
  });
};

const getUserById = async (id) => {
  return await prisma.user.findUnique({ where: { id } });
};

module.exports = { getAllUsers, getGuardUsers, updateUserProfile, getUserById };
