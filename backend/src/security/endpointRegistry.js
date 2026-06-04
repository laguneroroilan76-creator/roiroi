/**
 * backend/src/security/endpointRegistry.js
 * Master registry mapping all system endpoints for security audits.
 */

const ENDPOINT_REGISTRY = [
  // AUTH
  { route: '/api/auth/login', method: 'POST', authRequired: false, roles: [], sensitive: 'HIGH', workflowImpact: false },
  { route: '/api/auth/logout', method: 'POST', authRequired: true, roles: [], sensitive: 'LOW', workflowImpact: false },
  { route: '/api/auth/me', method: 'GET', authRequired: true, roles: [], sensitive: 'LOW', workflowImpact: false },

  // USERS
  { route: '/api/users', method: 'GET', authRequired: true, roles: ['Admin'], sensitive: 'MEDIUM', workflowImpact: false },
  { route: '/api/users/:id', method: 'PUT', authRequired: true, roles: ['Admin'], sensitive: 'HIGH', workflowImpact: false },
  
  // PRF
  { route: '/api/prfs', method: 'POST', authRequired: true, roles: [], sensitive: 'MEDIUM', workflowImpact: true },
  { route: '/api/prfs', method: 'GET', authRequired: true, roles: [], sensitive: 'LOW', workflowImpact: false },
  { route: '/api/prfs/:id', method: 'GET', authRequired: true, roles: [], sensitive: 'MEDIUM', workflowImpact: false }, // IDOR protected
  { route: '/api/prfs/:id', method: 'PUT', authRequired: true, roles: [], sensitive: 'HIGH', workflowImpact: false }, // IDOR & Sanitized
  { route: '/api/prfs/:id/verify', method: 'POST', authRequired: true, roles: ['Admin', 'canVerify'], sensitive: 'HIGH', workflowImpact: true },
  { route: '/api/prfs/:id/approve', method: 'POST', authRequired: true, roles: ['Admin', 'canApprove', 'canApprovePRF'], sensitive: 'HIGH', workflowImpact: true },
  { route: '/api/prfs/:id/reject', method: 'POST', authRequired: true, roles: ['Admin', 'canApprove', 'canApprovePRF', 'canVerify'], sensitive: 'HIGH', workflowImpact: true },
  
  // RFP
  { route: '/api/rfps', method: 'POST', authRequired: true, roles: [], sensitive: 'MEDIUM', workflowImpact: true },
  { route: '/api/rfps', method: 'GET', authRequired: true, roles: [], sensitive: 'LOW', workflowImpact: false },
  { route: '/api/rfps/:id', method: 'GET', authRequired: true, roles: [], sensitive: 'MEDIUM', workflowImpact: false },
  { route: '/api/rfps/:id', method: 'PUT', authRequired: true, roles: [], sensitive: 'HIGH', workflowImpact: false },
  { route: '/api/rfps/:id/approve', method: 'POST', authRequired: true, roles: ['Admin', 'canApprove', 'canApproveRFP'], sensitive: 'HIGH', workflowImpact: true },
  { route: '/api/rfps/:id/reject', method: 'POST', authRequired: true, roles: ['Admin', 'canApprove', 'canApproveRFP'], sensitive: 'HIGH', workflowImpact: true },
  
  // TRIP TICKETS
  { route: '/api/trip-tickets', method: 'POST', authRequired: true, roles: [], sensitive: 'MEDIUM', workflowImpact: true },
  { route: '/api/trip-tickets', method: 'GET', authRequired: true, roles: [], sensitive: 'LOW', workflowImpact: false },
  { route: '/api/trip-tickets/:id', method: 'GET', authRequired: true, roles: [], sensitive: 'MEDIUM', workflowImpact: false },
  { route: '/api/trip-tickets/:id', method: 'PUT', authRequired: true, roles: [], sensitive: 'HIGH', workflowImpact: false },
  { route: '/api/trip-tickets/:id/endorse', method: 'POST', authRequired: true, roles: ['Admin', 'canEndorse'], sensitive: 'HIGH', workflowImpact: true },
  { route: '/api/trip-tickets/:id/approve', method: 'POST', authRequired: true, roles: ['Admin', 'canApprove', 'canApproveTripTicket'], sensitive: 'HIGH', workflowImpact: true },
  { route: '/api/trip-tickets/:id/reject', method: 'POST', authRequired: true, roles: ['Admin', 'canApprove', 'canApproveTripTicket', 'canEndorse'], sensitive: 'HIGH', workflowImpact: true },
  
  // AUDIT
  { route: '/api/audit', method: 'GET', authRequired: true, roles: ['Admin'], sensitive: 'HIGH', workflowImpact: false }
];

module.exports = ENDPOINT_REGISTRY;
