const prisma = require('../config/database');
const { deriveRole } = require('../utils/userUtils');

const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: { 
      id: true, email: true, name: true, createdAt: true, 
      canApprove: true, canApprovePRF: true, 
      canApproveTripTicket: true, canApproveRFP: true,
      canApproveDeptHead: true, canEndorse: true, canVerify: true,
      role: true, avatarUrl: true, 
      themeColor: true, isDarkMode: true, permissions: true,
      status: true, inactiveReason: true,
      company: true,
      department: true
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
  if (data.companyId === '' || data.companyId === undefined) data.companyId = null;
  if (data.departmentId === '' || data.departmentId === undefined) data.departmentId = null;
  if (data.departmentRole === '' || data.departmentRole === undefined) data.departmentRole = null;

  // Force driver false when security guard
  if (data.isSecurityGuard) data.isDriver = false;

  // Lookup department name to derive role
  let departmentName = null;
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: Number(data.departmentId) } });
    departmentName = dept?.name || null;
  }

  const derivedRole = deriveRole(departmentName, !!data.isDriver, !!data.isSecurityGuard, !!data.isITSpecialist);
  data.role = derivedRole;

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
  return await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: { company: true, department: true }
  });
};

module.exports = { getAllUsers, getGuardUsers, updateUserProfile, updateUser, deleteUser, getUserById };
