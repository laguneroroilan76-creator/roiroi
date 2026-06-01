const prisma = require('../config/database');

const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: { 
      id: true, email: true, name: true, createdAt: true, 
      canApprove: true, canApprovePRF: true, 
      canApproveTripTicket: true, canApproveRFP: true,
      canApproveDeptHead: true, canEndorse: true, canVerify: true,
      role: true, avatarUrl: true, 
      themeColor: true, isDarkMode: true, permissions: true,
      status: true, inactiveReason: true, company: true
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

const updateUser = async (id, data) => {
  return await prisma.user.update({
    where: { id: parseInt(id) },
    data
  });
};

const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: { id: parseInt(id) }
  });
};

const getUserById = async (id) => {
  return await prisma.user.findUnique({ where: { id: parseInt(id) } });
};

module.exports = { getAllUsers, getGuardUsers, updateUserProfile, updateUser, deleteUser, getUserById };
