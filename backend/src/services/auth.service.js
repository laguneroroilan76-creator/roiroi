const prisma = require('../config/database');
const { sanitizeUser, deriveRole, deriveApprovalFlags } = require('../utils/userUtils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in .env');
}
const VALID_ROLES = ['User', 'Admin', 'Driver', 'Guard', 'Accounting', 'IT'];

const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      department: true,
      company: true,
    }
  });
  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user: sanitizeUser(user), token };
};

const register = async (userData) => {
  // Determine department name (if any) so we can derive role
  let departmentName = null;
  if (userData.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: Number(userData.departmentId) } });
    departmentName = dept?.name || null;
  }

  const derivedRole = deriveRole(departmentName, !!userData.isDriver, !!userData.isSecurityGuard, !!userData.isITSpecialist);
  const canApprove = derivedRole === 'Admin' ? true : (derivedRole === 'User' && !!userData.canApprove);
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Default permissions if none provided
  const permissions = userData.permissions || {};

  // Normalize empty strings/undefined for relation fields to null
  if (userData.companyId === '' || userData.companyId === undefined) userData.companyId = null;
  if (userData.departmentId === '' || userData.departmentId === undefined) userData.departmentId = null;
  if (userData.departmentRole === '' || userData.departmentRole === undefined) userData.departmentRole = null;

  const approvalFlags = deriveApprovalFlags(userData.departmentRole);

  const newUser = await prisma.user.create({
    data: {
      ...userData,
      ...approvalFlags,
      role: derivedRole,
      canApprove,
      permissions,
      password: hashedPassword
    }
  });

  return sanitizeUser(newUser);
};

module.exports = { login, register };
