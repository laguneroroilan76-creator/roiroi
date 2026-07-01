const prfService = require('../services/prf.service');
const activityService = require('../services/activity.service');
const { prfCreateBodySchema, prfUpdateBodySchema, formatZodErrors, idParamSchema } = require('../utils/validation');
const { createNotification } = require('./notification.controller');
const prisma = require('../config/database');
const auditService = require('../services/audit.service');
const { transition } = require('../workflow/workflow.engine');

// Helper to map frontend strings to backend dates/relations
const sanitizePayload = async (payload, reqUser) => {
  const data = { ...payload };
  
  // Convert Dates or set to null if empty
  if (data.dateRequested) data.dateRequested = new Date(data.dateRequested); else data.dateRequested = null;
  if (data.dateNeeded) data.dateNeeded = new Date(data.dateNeeded); else data.dateNeeded = null;

  // Map user relations if possible, then delete strings
  data.preparedById = reqUser.id; // Usually the author is the preparer
  
  const lookupUser = async (name) => {
    if (!name) return null;
    const u = await prisma.user.findFirst({ where: { name } });
    return u ? u.id : null;
  };

  if (data.verifiedBy) data.verifiedById = await lookupUser(data.verifiedBy);
  if (data.notedBy) data.notedById = await lookupUser(data.notedBy);
  if (data.approvedBy) data.approvedById = await lookupUser(data.approvedBy);
  if (data.requestor) data.requestorId = await lookupUser(data.requestor);

  // Removed strict stripping of status to restore frontend compatibility
  delete data.preparedBy;
  delete data.verifiedBy;
  delete data.notedBy;
  delete data.approvedBy;
  delete data.requestor;
  delete data.archivedBy;
  delete data.status;
  
  return data;
};

const createPRF = async (req, res) => {
  try {
    const validatedBody = prfCreateBodySchema.parse(req.body);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);
    sanitizedData.authorId = req.user.id;

    const prf = await prisma.$transaction(async (tx) => {
      if (!sanitizedData.status) sanitizedData.status = 'Pending Verification';
      const created = await tx.prf.create({ 
        data: {
          ...sanitizedData,
          items: sanitizedData.items ? { create: sanitizedData.items } : undefined
        } 
      });

      await auditService.log(tx, {
        userId: req.user.id, action: 'CREATE', tableName: 'Prf', recordId: created.id, newValues: created, ipAddress: req.ip
      });
      return created;
    });

    await createNotification({ message: `${req.user.name || 'A user'} submitted a new PRF`, type: 'NEW_PRF', targetRole: 'PRF_Approver', link: '/forms/prf' });
    res.status(201).json(prf);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: formatZodErrors(err) });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getPRFs = async (req, res) => {
  try {
    const hasAccess = req.user.role === 'Admin' || req.user.canApprove || req.user.canApprovePRF || req.user.canVerify;
    const prfs = await prfService.getPRFs(req.user.id, hasAccess, req.user.role === 'Guard');
    res.json(prfs);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getPRFById = async (req, res) => {
  try {
    const prf = await prfService.getPRFById(req.params.id, req.user);
    if (!prf) return res.status(404).json({ error: 'PRF not found' });
    res.json(prf);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const updatePRF = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = prfUpdateBodySchema.parse(req.body);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const prf = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.prf.findUnique({ where: { id } });
      const updated = await tx.prf.update({
        where: { id },
        data: {
          ...sanitizedData,
          items: sanitizedData.items ? { deleteMany: {}, create: sanitizedData.items } : undefined
        }
      });

      await auditService.log(tx, {
        userId: req.user.id, action: 'UPDATE', tableName: 'Prf', recordId: id, oldValues: oldRecord, newValues: updated, ipAddress: req.ip
      });
      return updated;
    });

    res.json(prf);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: formatZodErrors(err) });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const verifyPRF = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? prfUpdateBodySchema.parse(req.body) : {};
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const prf = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.prf.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');

      const tResult = transition({ entity: 'prf', currentStatus: oldRecord.status, action: 'verify', user: req.user });
      if (!tResult.allowed) throw new Error(tResult.error);

      const updateData = {
        ...sanitizedData,
        status: tResult.nextStatus,
        ...tResult.sideEffects,
      };
      delete updateData.items;

      const updateResult = await tx.prf.updateMany({
        where: { id, status: oldRecord.status },
        data: updateData
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      // If there are items, we need a separate query since updateMany doesn't support nested relations
      if (sanitizedData.items) {
        await tx.prf.update({
          where: { id },
          data: { items: { deleteMany: {}, create: sanitizedData.items } }
        });
      }

      const updated = await tx.prf.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'VERIFY', tableName: 'Prf', recordId: id, oldValues: oldRecord, newValues: updated, ipAddress: req.ip
      });
      return updated;
    });

    await createNotification({ message: `PRF #${id} verified.`, type: 'INFO', targetRole: 'PRF_Approver', link: '/pending' });
    res.json(prf);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: formatZodErrors(err) });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const approvePRF = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? prfUpdateBodySchema.parse(req.body) : {};
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const prf = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.prf.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');

      const tResult = transition({ entity: 'prf', currentStatus: oldRecord.status, action: 'approve', user: req.user });
      if (!tResult.allowed) throw new Error(tResult.error);

      const updateData = {
        ...sanitizedData,
        status: tResult.nextStatus,
        ...tResult.sideEffects,
      };
      delete updateData.items;

      const updateResult = await tx.prf.updateMany({
        where: { id, status: oldRecord.status },
        data: updateData
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      if (sanitizedData.items) {
        await tx.prf.update({
          where: { id },
          data: { items: { deleteMany: {}, create: sanitizedData.items } }
        });
      }

      const updated = await tx.prf.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'APPROVE', tableName: 'Prf', recordId: id, oldValues: oldRecord, newValues: updated, ipAddress: req.ip
      });
      return updated;
    });
    
    await createNotification({ message: `Your PRF #${id} has been Approved`, type: 'APPROVED', targetUserId: prf.authorId, link: '/history' });
    res.json(prf);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: formatZodErrors(err) });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const rejectPRF = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? prfUpdateBodySchema.parse(req.body) : {};
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const prf = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.prf.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');

      const tResult = transition({ entity: 'prf', currentStatus: oldRecord.status, action: 'reject', user: req.user });
      if (!tResult.allowed) throw new Error(tResult.error);

      const rejectData = {
        ...sanitizedData,
        status: tResult.nextStatus,
        ...tResult.sideEffects,
        disapprovalReason: req.body.reason || req.body.disapprovalReason || 'Rejected by Approver',
      };
      delete rejectData.items;

      const updateResult = await tx.prf.updateMany({
        where: { id, status: oldRecord.status },
        data: rejectData
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      if (sanitizedData.items) {
        await tx.prf.update({
          where: { id },
          data: { items: { deleteMany: {}, create: sanitizedData.items } }
        });
      }

      const updated = await tx.prf.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'REJECT', tableName: 'Prf', recordId: id, oldValues: oldRecord, newValues: updated, ipAddress: req.ip
      });
      return updated;
    });

    await createNotification({ message: `Your PRF #${id} was Rejected`, type: 'REJECTED', targetUserId: prf.authorId, link: '/history' });
    res.json(prf);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: formatZodErrors(err) });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const deletePRF = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prfService.deletePRF(id);
    res.json({ message: 'PRF deleted successfully' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const cancelPRF = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const prf = await prisma.prf.findUnique({ where: { id } });
    if (!prf) return res.status(404).json({ error: 'PRF not found' });
    
    if (prf.authorId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only the author can cancel this request' });
    }

    if (prf.status === 'Approved' || prf.status === 'Completed' || prf.status === 'Verified') {
      return res.status(400).json({ error: 'Cannot cancel an already processed request' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.prf.update({
        where: { id },
        data: { status: 'Cancelled' }
      });
      await auditService.log(tx, {
        userId: req.user.id, action: 'CANCEL', tableName: 'Prf', recordId: id, oldValues: prf, newValues: result, ipAddress: req.ip
      });
      return result;
    });

    res.json(updated);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createPRF,
  getPRFs,
  getPRFById,
  updatePRF,
  deletePRF,
  cancelPRF,
  verifyPRF,
  approvePRF,
  rejectPRF
};
