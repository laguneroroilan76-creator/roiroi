/**
 * workflow.engine.js
 * Centralized workflow rules and state machine.
 */

const STATE_MACHINES = {
  prf: {
    states: {
      'Pending': {
        verify: { nextStatus: 'Pending Approval', roleCheck: (user) => user.canVerify || user.role === 'Admin' },
        reject: { nextStatus: 'Disapproved', roleCheck: (user) => user.canVerify || user.role === 'Admin' }
      },
      'Verified': {
        approve: { nextStatus: 'Approved', roleCheck: (user) => user.canApprovePRF || user.canApprove || user.role === 'Admin' },
        reject: { nextStatus: 'Disapproved', roleCheck: (user) => user.canApprovePRF || user.canApprove || user.role === 'Admin' }
      },
      'Approved': {
        reject: { nextStatus: 'Disapproved', roleCheck: (user) => user.canApprovePRF || user.canApprove || user.role === 'Admin' }
      },
      'Disapproved': {}
    }
  },
  rfp: {
    states: {
      'Pending': {
        approve_dept: { nextStatus: 'Pending Final Approval', roleCheck: (user) => user.canApproveDeptHead || user.role === 'Admin' },
        approve: { nextStatus: 'Approved', roleCheck: (user) => user.canApproveRFP || user.canApprove || user.role === 'Admin' },
        reject: { nextStatus: 'Disapproved', roleCheck: (user) => user.canApproveRFP || user.canApprove || user.role === 'Admin' }
      },
      'Approved': {
        receive: { nextStatus: 'Received', roleCheck: (user) => user.role === 'Admin' || user.role === 'Accounting' },
        reject: { nextStatus: 'Disapproved', roleCheck: (user) => user.canApproveRFP || user.canApprove || user.role === 'Admin' }
      },
      'Received': {},
      'Disapproved': {}
    }
  },
  tripTicket: {
    states: {
      'Pending': {
        endorse: {
          nextStatus: 'Endorsed',
          roleCheck: (user, context = {}) => {
            if (!context.expectedEndorser) return false;
            return Number(context.expectedEndorser.id) === Number(user.id);
          }
        },
        reject: {
          nextStatus: 'Disapproved',
          roleCheck: (user, context = {}) => {
            const isEndorser = context.expectedEndorser && Number(context.expectedEndorser.id) === Number(user.id);
            const isApprover = context.expectedApprover && Number(context.expectedApprover.id) === Number(user.id);
            return isEndorser || isApprover;
          }
        }
      },
      'Endorsed': {
        approve: {
          nextStatus: 'Approved',
          roleCheck: (user, context = {}) => {
            if (!context.expectedApprover) return false;
            return Number(context.expectedApprover.id) === Number(user.id);
          }
        },
        reject: {
          nextStatus: 'Disapproved',
          roleCheck: (user, context = {}) => {
            const isEndorser = context.expectedEndorser && Number(context.expectedEndorser.id) === Number(user.id);
            const isApprover = context.expectedApprover && Number(context.expectedApprover.id) === Number(user.id);
            return isEndorser || isApprover;
          }
        }
      },
      'Approved': {
        complete: { nextStatus: 'Completed', roleCheck: (user) => user.role === 'Guard' || user.role === 'Admin' },
        reject: {
          nextStatus: 'Disapproved',
          roleCheck: (user, context = {}) => {
            const isEndorser = context.expectedEndorser && Number(context.expectedEndorser.id) === Number(user.id);
            const isApprover = context.expectedApprover && Number(context.expectedApprover.id) === Number(user.id);
            return isEndorser || isApprover;
          }
        }
      },
      'Completed': {},
      'Disapproved': {}
    }
  }
};

/**
 * Validates and computes the next state.
 * @param {Object} params
 * @param {string} params.entity - 'prf' | 'rfp' | 'tripTicket'
 * @param {string} params.currentStatus
 * @param {string} params.action - 'verify' | 'approve' | 'reject' | 'endorse' | 'complete' | 'receive'
 * @param {Object} params.user
 * @returns {Object} { allowed: boolean, nextStatus: string, sideEffects: Object, error: string }
 */
const transition = ({ entity, currentStatus, action, user, context }) => {
  const machine = STATE_MACHINES[entity];
  if (!machine) {
    return { allowed: false, error: `Unknown entity type: ${entity}` };
  }

  // To map legacy statuses to unified canonical states
  let canonicalStatus = currentStatus;
  if (currentStatus === 'Pending Verification' || currentStatus === 'Pending Dept Head Approval' || currentStatus === 'Pending Endorsement') {
    canonicalStatus = 'Pending';
  } else if (currentStatus === 'Pending Approval' && entity === 'prf') {
    canonicalStatus = 'Verified';
  } else if (currentStatus === 'Pending Approval' && entity === 'tripTicket') {
    canonicalStatus = 'Endorsed';
  } else if (currentStatus === 'Pending Final Approval' && entity === 'rfp') {
    canonicalStatus = 'Pending';
  } else if (currentStatus === 'ARRIVED') {
    canonicalStatus = 'Completed';
  }

  const stateDef = machine.states[canonicalStatus];
  if (!stateDef) {
    return { allowed: false, error: `Invalid current status: '${currentStatus}' (mapped to '${canonicalStatus}')` };
  }

  const transitionDef = stateDef[action];
  if (!transitionDef) {
    return { allowed: false, error: `Action '${action}' not allowed from status '${canonicalStatus}'` };
  }

  if (!transitionDef.roleCheck(user, context)) {
    return { allowed: false, error: `User does not have permission to perform '${action}'` };
  }

  const sideEffects = {};
  if (action === 'verify') sideEffects.verifiedById = user.id;
  if (action === 'approve') sideEffects.approvedById = user.id;
  if (action === 'endorse') sideEffects.endorsedById = user.id;
  if (action === 'reject') sideEffects.archivedById = user.id; // Legacy logic used archivedById for rejection tracking

  return {
    allowed: true,
    nextStatus: transitionDef.nextStatus,
    sideEffects
  };
};

module.exports = {
  transition,
  STATE_MACHINES
};
