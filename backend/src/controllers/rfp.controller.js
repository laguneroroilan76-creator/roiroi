const rfpService = require('../services/rfp.service');
const activityService = require('../services/activity.service');
const { rfpCreateBodySchema, formatZodErrors, idParamSchema } = require('../utils/validation');
const { createNotification } = require('./notification.controller');
const prisma = require('../config/database');
const auditService = require('../services/audit.service');
const { transition } = require('../workflow/workflow.engine');

const sanitizePayload = async (payload, reqUser) => {
  const data = { ...payload };
  if (data.dateRequested) data.dateRequested = new Date(data.dateRequested); else data.dateRequested = null;
  if (data.dateNeeded) data.dateNeeded = new Date(data.dateNeeded); else data.dateNeeded = null;
  if (data.receivedDate) data.receivedDate = new Date(data.receivedDate); else data.receivedDate = null;

  data.preparedById = reqUser.id;
  
  const lookupUser = async (name) => {
    if (!name) return null;
    const u = await prisma.user.findFirst({ where: { name } });
    return u ? u.id : null;
  };

  if (data.verifiedBy) data.verifiedById = await lookupUser(data.verifiedBy);
  if (data.approvedBy) data.approvedById = await lookupUser(data.approvedBy);
  if (data.requestor) data.requestorId = await lookupUser(data.requestor);
  
  // Map legacy RFP/RFP fields
  data.rfpNo = data.rfpNo || data.rfpNo || null;
  data.department = data.department || data.chargeTo || null;
  data.remarks = data.remarks || data.purpose || null;
  data.layout = JSON.stringify(payload);
  
  delete data.rfpNo;
  delete data.chargeTo;
  delete data.releaseFundsTo;
  delete data.amount;
  delete data.purpose;
  delete data.poNumber;
  delete data.siNumber;
  delete data.prfNo;
  
  // Removed strict stripping of status to restore frontend compatibility
  delete data.preparedBy;
  delete data.verifiedBy;
  delete data.approvedBy;
  delete data.requestor;
  delete data.archivedBy;
  delete data.status;
  delete data.deptHead;
  
  return data;
};

const createRFP = async (req, res) => {
  try {
    const validatedBody = rfpCreateBodySchema.parse(req.body);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);
    sanitizedData.authorId = req.user.id;

    const rfp = await prisma.$transaction(async (tx) => {
      if (!sanitizedData.status) sanitizedData.status = 'Pending Dept Head Approval';
      const created = await tx.rfp.create({ 
        data: {
          ...sanitizedData,
          items: sanitizedData.items ? { create: sanitizedData.items } : undefined
        } 
      });
      await auditService.log(tx, {
        userId: req.user.id, action: 'CREATE', tableName: 'Rfp', recordId: created.id, newValues: created, ipAddress: req.ip
      });
      return created;
    });

    await createNotification({ message: `${req.user.name || 'A user'} submitted a new RFP`, type: 'NEW_RFP', targetRole: 'RFP_Approver', link: '/forms/rfp' });
    res.status(201).json(rfp);
  } catch (err) {
    if (err.name === 'ZodError') { console.error("ZodError:", formatZodErrors(err)); return res.status(400).json({ error: formatZodErrors(err) }); }
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getRFPs = async (req, res) => {
  try {
    const hasAccess = req.user.role === 'Admin' || req.user.canApprove || req.user.canApproveRFP || req.user.canApproveDeptHead || req.user.canVerify || req.user.role === 'Accounting';
    const rfps = await rfpService.getRFPs(req.user.id, hasAccess, req.user.role);
    res.json(rfps);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getRFPById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rfp = await rfpService.getRFPById(id, req.user);
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });
    res.json(rfp);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const updateRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = rfpCreateBodySchema.parse(req.body);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const rfp = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rfp.findUnique({ where: { id } });
      const updated = await tx.rfp.update({
        where: { id },
        data: {
          ...sanitizedData,
          items: sanitizedData.items ? { deleteMany: {}, create: sanitizedData.items } : undefined
        }
      });

      await auditService.log(tx, {
        userId: req.user.id, action: 'UPDATE', tableName: 'Rfp', recordId: id, oldValues: oldRecord, newValues: updated, ipAddress: req.ip
      });
      return updated;
    });

    res.json(rfp);
  } catch (err) {
    if (err.name === 'ZodError') { console.error("ZodError:", formatZodErrors(err)); return res.status(400).json({ error: formatZodErrors(err) }); }
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const deleteRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await rfpService.deleteRFP(id);
    res.json({ message: 'RFP deleted successfully' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const cancelRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rfp = await prisma.rfp.findUnique({ where: { id } });
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });
    
    const isAuthor = rfp.authorId === req.user.id;
    const isAdmin = req.user.role === 'Admin';
    const isAccounting = req.user.role === 'Accounting';

    if (!isAuthor && !isAdmin && !isAccounting) {
      return res.status(403).json({ error: 'Only the author, Admin, or Accounting can cancel this request' });
    }

    if (rfp.status === 'Received' || rfp.status === 'Completed' || (rfp.status === 'Approved' && !isAccounting && !isAdmin)) {
      return res.status(400).json({ error: 'Cannot cancel an already processed request' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.rfp.update({
        where: { id },
        data: { status: 'Cancelled', archivedById: req.user.id }
      });
      await auditService.log(tx, {
        userId: req.user.id, action: 'CANCEL', tableName: 'Rfp', recordId: id, oldValues: rfp, newValues: result, ipAddress: req.ip
      });
      return result;
    });

    res.json(updated);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};


const approveRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? rfpCreateBodySchema.parse(req.body) : {};
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rfp.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');
      
      const tResult = transition({ entity: 'rfp', currentStatus: oldRecord.status, action: 'approve', user: req.user });
      if (!tResult.allowed) throw new Error(tResult.error);

      const updateData = {
        ...sanitizedData,
        status: tResult.nextStatus,
        ...tResult.sideEffects,
      };
      delete updateData.items;
      
      const updateResult = await tx.rfp.updateMany({
        where: { id, status: oldRecord.status },
        data: updateData
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      if (sanitizedData.items) {
        await tx.rfp.update({
          where: { id },
          data: { items: { deleteMany: {}, create: sanitizedData.items } }
        });
      }

      const updatedRecord = await tx.rfp.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'APPROVE', tableName: 'Rfp', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') { console.error("ZodError:", formatZodErrors(err)); return res.status(400).json({ error: formatZodErrors(err) }); }
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const approveDeptRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? rfpCreateBodySchema.parse(req.body) : {};
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rfp.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');
      
      const tResult = transition({ entity: 'rfp', currentStatus: oldRecord.status, action: 'approve_dept', user: req.user });
      if (!tResult.allowed) throw new Error(tResult.error);

      const updateData = {
        ...sanitizedData,
        status: tResult.nextStatus,
        ...tResult.sideEffects,
      };
      delete updateData.items;
      
      const updateResult = await tx.rfp.updateMany({
        where: { id, status: oldRecord.status },
        data: updateData
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      if (sanitizedData.items) {
        await tx.rfp.update({
          where: { id },
          data: { items: { deleteMany: {}, create: sanitizedData.items } }
        });
      }

      const updatedRecord = await tx.rfp.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'APPROVE_DEPT', tableName: 'Rfp', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') { console.error("ZodError:", formatZodErrors(err)); return res.status(400).json({ error: formatZodErrors(err) }); }
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const rejectRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? rfpCreateBodySchema.parse(req.body) : {};
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rfp.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');
      
      const tResult = transition({ entity: 'rfp', currentStatus: oldRecord.status, action: 'reject', user: req.user });
      if (!tResult.allowed) throw new Error(tResult.error);

      const rejectData = {
        ...sanitizedData,
        status: tResult.nextStatus,
        ...tResult.sideEffects,
        disapprovalReason: req.body.disapprovalReason || req.body.reason || 'Rejected',
        archivedById: req.user.id
      };
      delete rejectData.items;

      const updateResult = await tx.rfp.updateMany({
        where: { id, status: oldRecord.status },
        data: rejectData
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      if (sanitizedData.items) {
        await tx.rfp.update({
          where: { id },
          data: { items: { deleteMany: {}, create: sanitizedData.items } }
        });
      }

      const updatedRecord = await tx.rfp.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'REJECT', tableName: 'Rfp', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') { console.error("ZodError:", formatZodErrors(err)); return res.status(400).json({ error: formatZodErrors(err) }); }
    console.error(err); res.status(500).json({ error: err.message });
  }
};


const receiveRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rfp.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');
      
      const tResult = transition({ entity: 'rfp', currentStatus: oldRecord.status, action: 'receive', user: req.user });
      if (!tResult.allowed) throw new Error(tResult.error);

      const updateData = {
        status: tResult.nextStatus,
        ...tResult.sideEffects,
        receivedBy: req.user.name || 'ACCOUNTING',
        receivedDate: new Date()
      };
      
      const updateResult = await tx.rfp.updateMany({
        where: { id, status: oldRecord.status },
        data: updateData
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      const updatedRecord = await tx.rfp.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'RECEIVE', tableName: 'Rfp', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRFP,
  getRFPs,
  getRFPById,
  updateRFP,
  deleteRFP,
  cancelRFP,
  approveRFP,
  approveDeptRFP,
  rejectRFP,
  receiveRFP
};
