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

  return {
    ...sanitized,
    departmentRole: user.departmentRole || null,
    departmentId: user.departmentId || null,
    companyId: user.companyId || null,
    isDriver: user.isDriver || false,
    isRFPApprover: user.isRFPApprover || false,
    isSecurityGuard: user.isSecurityGuard || false,
    isITSpecialist: user.isITSpecialist || false,
    department: user.department || null,
    company: user.company || null,
  };
};

function deriveRole(departmentName, isDriver, isSecurityGuard, isITSpecialist, departmentRole) {
  if (isSecurityGuard) return 'Guard';
  if (departmentRole === 'ImmediateSupervisor' && departmentName === 'Admin') return 'Admin';
  if (departmentName === 'Admin' && isITSpecialist) return 'IT';
  if (departmentName === 'Admin') return 'Admin';
  if (departmentName === 'Accounting') return 'Accounting';
  return 'User';
}

const deriveApprovalFlags = (departmentRole) => {
  if (departmentRole === 'President') {
    return {
      canApprove: true,
      canApprovePRF: true,
      canApproveRFP: true,
      canApproveTripTicket: true,
      canApproveDeptHead: true,
      canEndorse: true,
      canVerify: true,
    };
  }
  if (departmentRole === 'DepartmentHead') {
    return {
      canApprove: false,
      canApprovePRF: false,
      canApproveRFP: false,
      canApproveTripTicket: true,
      canApproveDeptHead: true,
      canEndorse: true,
      canVerify: true,
    };
  }
  if (departmentRole === 'ImmediateSupervisor') {
    return {
      canApprove: false,
      canApprovePRF: false,
      canApproveRFP: false,
      canApproveTripTicket: false,
      canApproveDeptHead: false,
      canEndorse: true,
      canVerify: false,
    };
  }
  return {
    canApprove: false,
    canApprovePRF: false,
    canApproveRFP: false,
    canApproveTripTicket: false,
    canApproveDeptHead: false,
    canEndorse: false,
    canVerify: false,
  };
};

module.exports = { sanitizeUser, deriveRole, deriveApprovalFlags };
