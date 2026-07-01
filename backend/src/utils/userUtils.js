const sanitizeUser = (user) => {
  if (!user) return null;

  const allowedFields = [
    'id', 'email', 'name', 'createdAt', 'updatedAt',
    'canApprove', 'canApprovePRF', 'canApproveTripTicket',
    'canApproveRFP', 'canApproveDeptHead', 'canEndorse', 'canVerify',
    'signatureUrl', 'avatarUrl', 'themeColor', 'isDarkMode',
    'role', 'status', 'inactiveReason', 'company', 'permissions'
  ];

  const sanitized = {};
  for (const field of allowedFields) {
    if (user[field] !== undefined) {
      sanitized[field] = user[field];
    }
  }

  return sanitized;
};

function deriveRole(departmentName, isDriver, isSecurityGuard, isITSpecialist) {
  if (isSecurityGuard) return 'Guard';
  if (isDriver) return 'Driver';
  if (departmentName === 'Admin' && isITSpecialist) return 'IT';
  if (departmentName === 'Admin') return 'Admin';
  if (departmentName === 'Accounting') return 'Accounting';
  return 'User';
}

module.exports = { sanitizeUser, deriveRole };
