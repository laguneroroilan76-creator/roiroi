const rfpService = require('../services/rfp.service');
const activityService = require('../services/activity.service');
const { rrfCreateBodySchema, formatZodErrors, idParamSchema } = require('../utils/validation');
const { createNotification } = require('./notification.controller');
const prisma = require('../config/database');

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
  
  // Map legacy RRF/RFP fields
  data.rrfNo = data.rfpNo || data.rrfNo || null;
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
    const validatedBody = rrfCreateBodySchema.parse(req.body);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);
    sanitizedData.authorId = req.user.id;

    const rfp = await prisma.$transaction(async (tx) => {
      if (!sanitizedData.status) sanitizedData.status = 'Pending Dept Head Approval';
      const created = await tx.rrf.create({ 
        data: {
          ...sanitizedData,
          items: sanitizedData.items ? { create: sanitizedData.items } : undefined
        } 
      });
      await tx.auditTrail.create({
        data: { userId: req.user.id, action: 'CREATE', tableName: 'Rrf', recordId: created.id, newValues: created, ipAddress: req.ip }
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
    const rfp = await rfpService.getRFPById(id);
    res.json(rfp);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const updateRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = rrfCreateBodySchema.parse(req.body);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const rfp = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rrf.findUnique({ where: { id } });
      const updated = await tx.rrf.update({
        where: { id },
        data: {
          ...sanitizedData,
          items: sanitizedData.items ? { deleteMany: {}, create: sanitizedData.items } : undefined
        }
      });

      await tx.auditTrail.create({
        data: { userId: req.user.id, action: 'UPDATE', tableName: 'Rrf', recordId: id, oldValues: oldRecord, newValues: updated, ipAddress: req.ip }
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


const approveRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rrf.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');
      
      const newStatus = oldRecord.status === 'Pending Dept Head Approval' ? 'Pending Final Approval' : 'Approved';
      const updateData = { status: newStatus };
      if (newStatus === 'Approved') {
        updateData.approvedById = req.user.id;
      }
      
      const updatedRecord = await tx.rrf.update({
        where: { id },
        data: updateData
      });
      await tx.auditTrail.create({
        data: { userId: req.user.id, action: 'APPROVE', tableName: 'Rrf', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip }
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const rejectRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { disapprovalReason } = req.body;
    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.rrf.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');
      
      const updatedRecord = await tx.rrf.update({
        where: { id },
        data: { status: 'Disapproved', disapprovalReason }
      });
      await tx.auditTrail.create({
        data: { userId: req.user.id, action: 'REJECT', tableName: 'Rrf', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip }
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};
module.exports = { createRFP, getRFPs, getRFPById, updateRFP, deleteRFP, approveRFP, rejectRFP };
