/**
 * Audit Logging Utility
 * Records all changes to AuditTrail table for compliance and debugging
 * 
 * Usage:
 *   await logAuditTrail(userId, 'UPDATE', 'Prf', prfId, oldData, newData, ipAddress)
 */

const prisma = require('../config/database');

/**
 * Records an audit trail entry
 * @param {number} userId - User ID performing the action
 * @param {string} action - Action type (CREATE, UPDATE, APPROVE, REJECT, DELETE)
 * @param {string} tableName - Table name (Prf, TripTicket, Rrf)
 * @param {number} recordId - ID of the affected record
 * @param {object} oldValues - Original data (null for CREATE)
 * @param {object} newValues - New data (null for DELETE)
 * @param {string} ipAddress - IP address of the request
 * @returns {Promise<object>} The created AuditTrail record
 */
const logAuditTrail = async (userId, action, tableName, recordId, oldValues = null, newValues = null, ipAddress = null) => {
  try {
    return await prisma.auditTrail.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to log audit trail:', error);
    // Don't throw - audit logging should not break the application
    return null;
  }
};

/**
 * Compares two objects and returns only changed fields
 * @param {object} oldObj - Original object
 * @param {object} newObj - Updated object
 * @returns {object} Object with changed fields
 */
const getChangedFields = (oldObj, newObj) => {
  if (!oldObj) return newObj;
  if (!newObj) return oldObj;

  const changes = {};
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

  for (const key of allKeys) {
    const oldVal = JSON.stringify(oldObj?.[key]);
    const newVal = JSON.stringify(newObj?.[key]);
    if (oldVal !== newVal) {
      changes[key] = { old: oldObj?.[key], new: newObj?.[key] };
    }
  }

  return changes;
};

/**
 * Safe field extractor - removes sensitive data and circular references
 * @param {object} obj - Object to extract fields from
 * @returns {object} Cleaned object
 */
const extractSafeFields = (obj) => {
  if (!obj) return null;

  const safe = {};
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      continue;
    }
    // Skip large text fields
    if (typeof value === 'string' && value.length > 5000) {
      safe[key] = value.substring(0, 100) + '... [truncated]';
    } else if (typeof value === 'object' && value !== null) {
      // Skip nested objects - only capture primitives
      continue;
    } else {
      safe[key] = value;
    }
  }

  return safe;
};

module.exports = {
  logAuditTrail,
  getChangedFields,
  extractSafeFields
};
