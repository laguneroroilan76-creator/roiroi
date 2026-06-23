const prisma = require('../config/database');
const auditService = require('./audit.service');

/**
 * Validates PRFs and checks for workflow state vs actor integrity.
 * @param {boolean} safeFix - If true, attempt to auto-repair.
 */
const validatePRF = async (safeFix = false) => {
  const prfs = await prisma.prf.findMany();
  let errors = [];
  let fixed = [];
  
  for (const prf of prfs) {
    let needsUpdate = false;
    let updateData = {};
    
    // Status == 'Approved' requires approvedById
    if (prf.status === 'Approved' && !prf.approvedById) {
      errors.push({ id: prf.id, model: 'Prf', type: 'MISSING_ACTOR', expected: 'approvedById', status: prf.status });
      // Attempt safe fix: Look for audit log
      const audit = await prisma.auditTrail.findFirst({ where: { tableName: 'Prf', recordId: prf.id, action: 'APPROVE' }, orderBy: { id: 'desc' } });
      if (audit && safeFix) {
        updateData.approvedById = audit.userId;
        needsUpdate = true;
        fixed.push({ id: prf.id, model: 'Prf', field: 'approvedById', value: audit.userId, source: 'AuditTrail' });
      }
    }
    
    // Status == 'Disapproved' requires archivedById
    if (prf.status === 'Disapproved' && !prf.archivedById) {
      errors.push({ id: prf.id, model: 'Prf', type: 'MISSING_ACTOR', expected: 'archivedById', status: prf.status });
      const audit = await prisma.auditTrail.findFirst({ where: { tableName: 'Prf', recordId: prf.id, action: 'REJECT' }, orderBy: { id: 'desc' } });
      if (audit && safeFix) {
        updateData.archivedById = audit.userId;
        needsUpdate = true;
        fixed.push({ id: prf.id, model: 'Prf', field: 'archivedById', value: audit.userId, source: 'AuditTrail' });
      }
    }

    // Status == 'Pending' should not have approvedById or archivedById
    if ((prf.status === 'Pending' || prf.status === 'Pending Verification' || prf.status === 'Pending Approval') && (prf.approvedById || prf.archivedById)) {
      errors.push({ id: prf.id, model: 'Prf', type: 'ORPHANED_ACTOR', status: prf.status });
      if (safeFix) {
        updateData.approvedById = null;
        updateData.archivedById = null;
        needsUpdate = true;
        fixed.push({ id: prf.id, model: 'Prf', field: 'approvedById/archivedById', value: null, source: 'State Reset' });
      }
    }

    if (needsUpdate && safeFix) {
      await prisma.$transaction(async (tx) => {
        const oldRecord = await tx.prf.findUnique({ where: { id: prf.id } });
        const newRecord = await tx.prf.update({ where: { id: prf.id }, data: updateData });
        await auditService.log(tx, {
          userId: 1, // System Admin fallback if no context
          action: 'AUTO_REPAIR',
          tableName: 'Prf',
          recordId: prf.id,
          oldValues: oldRecord,
          newValues: newRecord,
          ipAddress: '127.0.0.1'
        });
      });
    }
  }

  return { totalChecked: prfs.length, errors, fixed };
};

const validateRFP = async (safeFix = false) => {
  const rfps = await prisma.rfp.findMany();
  let errors = [];
  let fixed = [];
  
  for (const rfp of rfps) {
    let needsUpdate = false;
    let updateData = {};
    
    if (rfp.status === 'Approved' && !rfp.approvedById) {
      errors.push({ id: rfp.id, model: 'Rfp', type: 'MISSING_ACTOR', expected: 'approvedById', status: rfp.status });
      const audit = await prisma.auditTrail.findFirst({ where: { tableName: 'Rfp', recordId: rfp.id, action: 'APPROVE' }, orderBy: { id: 'desc' } });
      if (audit && safeFix) {
        updateData.approvedById = audit.userId;
        needsUpdate = true;
        fixed.push({ id: rfp.id, model: 'Rfp', field: 'approvedById', value: audit.userId, source: 'AuditTrail' });
      }
    }
    
    if (rfp.status === 'Received' && !rfp.receivedBy) {
      errors.push({ id: rfp.id, model: 'Rfp', type: 'MISSING_ACTOR', expected: 'receivedBy', status: rfp.status });
    }

    if (rfp.status === 'Disapproved' && !rfp.archivedById) {
      errors.push({ id: rfp.id, model: 'Rfp', type: 'MISSING_ACTOR', expected: 'archivedById', status: rfp.status });
      const audit = await prisma.auditTrail.findFirst({ where: { tableName: 'Rfp', recordId: rfp.id, action: 'REJECT' }, orderBy: { id: 'desc' } });
      if (audit && safeFix) {
        updateData.archivedById = audit.userId;
        needsUpdate = true;
        fixed.push({ id: rfp.id, model: 'Rfp', field: 'archivedById', value: audit.userId, source: 'AuditTrail' });
      }
    }

    if (needsUpdate && safeFix) {
      await prisma.$transaction(async (tx) => {
        const oldRecord = await tx.rfp.findUnique({ where: { id: rfp.id } });
        const newRecord = await tx.rfp.update({ where: { id: rfp.id }, data: updateData });
        await auditService.log(tx, {
          userId: 1, action: 'AUTO_REPAIR', tableName: 'Rfp', recordId: rfp.id, oldValues: oldRecord, newValues: newRecord, ipAddress: '127.0.0.1'
        });
      });
    }
  }

  return { totalChecked: rfps.length, errors, fixed };
};

const validateTripTicket = async (safeFix = false) => {
  const tickets = await prisma.tripTicket.findMany();
  let errors = [];
  let fixed = [];
  
  for (const t of tickets) {
    let needsUpdate = false;
    let updateData = {};
    
    if (t.status === 'Approved' && !t.approvedById) {
      errors.push({ id: t.id, model: 'TripTicket', type: 'MISSING_ACTOR', expected: 'approvedById', status: t.status });
      const audit = await prisma.auditTrail.findFirst({ where: { tableName: 'TripTicket', recordId: t.id, action: 'APPROVE' }, orderBy: { id: 'desc' } });
      if (audit && safeFix) {
        updateData.approvedById = audit.userId;
        needsUpdate = true;
        fixed.push({ id: t.id, model: 'TripTicket', field: 'approvedById', value: audit.userId, source: 'AuditTrail' });
      }
    }
    
    if (t.status === 'Endorsed' && !t.endorsedById) {
      errors.push({ id: t.id, model: 'TripTicket', type: 'MISSING_ACTOR', expected: 'endorsedById', status: t.status });
      const audit = await prisma.auditTrail.findFirst({ where: { tableName: 'TripTicket', recordId: t.id, action: 'ENDORSE' }, orderBy: { id: 'desc' } });
      if (audit && safeFix) {
        updateData.endorsedById = audit.userId;
        needsUpdate = true;
        fixed.push({ id: t.id, model: 'TripTicket', field: 'endorsedById', value: audit.userId, source: 'AuditTrail' });
      }
    }

    if (t.status === 'Completed' && !t.dateTimeReturn) {
      errors.push({ id: t.id, model: 'TripTicket', type: 'MISSING_ACTOR', expected: 'dateTimeReturn', status: t.status });
    }

    if (t.status === 'Disapproved' && !t.archivedById) {
      errors.push({ id: t.id, model: 'TripTicket', type: 'MISSING_ACTOR', expected: 'archivedById', status: t.status });
      const audit = await prisma.auditTrail.findFirst({ where: { tableName: 'TripTicket', recordId: t.id, action: 'REJECT' }, orderBy: { id: 'desc' } });
      if (audit && safeFix) {
        updateData.archivedById = audit.userId;
        needsUpdate = true;
        fixed.push({ id: t.id, model: 'TripTicket', field: 'archivedById', value: audit.userId, source: 'AuditTrail' });
      }
    }

    if (needsUpdate && safeFix) {
      await prisma.$transaction(async (tx) => {
        const oldRecord = await tx.tripTicket.findUnique({ where: { id: t.id } });
        const newRecord = await tx.tripTicket.update({ where: { id: t.id }, data: updateData });
        await auditService.log(tx, {
          userId: 1, action: 'AUTO_REPAIR', tableName: 'TripTicket', recordId: t.id, oldValues: oldRecord, newValues: newRecord, ipAddress: '127.0.0.1'
        });
      });
    }
  }

  return { totalChecked: tickets.length, errors, fixed };
};

const runIntegrityScan = async (safeFix = false) => {
  const prfResult = await validatePRF(safeFix);
  const rfpResult = await validateRFP(safeFix);
  const ticketResult = await validateTripTicket(safeFix);

  return {
    prf: prfResult,
    rfp: rfpResult,
    tripTicket: ticketResult
  };
};

module.exports = {
  validatePRF,
  validateRFP,
  validateTripTicket,
  runIntegrityScan
};
