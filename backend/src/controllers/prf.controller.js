const prfService = require('../services/prf.service');
const activityService = require('../services/activity.service');
const { prfCreateBodySchema, prfUpdateBodySchema, formatZodErrors, idParamSchema } = require('../utils/validation');
const { createNotification } = require('./notification.controller');

const createPRF = async (req, res) => {
  try {
    const validatedBody = prfCreateBodySchema.parse(req.body);
    const prf = await prfService.createPRF(req.user.id, validatedBody);
    
    await activityService.logActivity(
      req.user.id, 
      'CREATE', 
      'PRF', 
      prf.id, 
      `${req.user.name || 'Unknown User'} created PRF #${prf.prfNo || prf.id}`
    );

    await createNotification({
      message: `${req.user.name || 'A user'} submitted a new PRF #${prf.prfNo || prf.id}`,
      type: 'NEW_PRF',
      targetRole: 'PRF_Approver',
      link: '/forms/prf'
    });
    
    res.status(201).json(prf);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: formatZodErrors(err) });
    }
    res.status(500).json({ error: err.message });
  }
};


const getPRFs = async (req, res) => {
  try {
    // Check if user has overall approve power or specific PRF approve power, or verifier power
    const hasAccess = req.user.role === 'Admin' || req.user.canApprove || req.user.canApprovePRF || req.user.canVerify;
    const prfs = await prfService.getPRFs(req.user.id, hasAccess, req.user.role === 'Guard');
    res.json(prfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPRFById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid PRF ID.' });

    const prf = await prfService.getPRFById(id);
    if (!prf) return res.status(404).json({ error: 'PRF not found' });

    // Access control: Author, Admin/Approver, or specific PRF roles
    const hasAccess = req.user.role === 'Admin' || req.user.canApprove || req.user.canApprovePRF || req.user.canVerify || prf.authorId === req.user.id;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(prf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePRF = async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const validatedBody = prfUpdateBodySchema.parse(req.body);

    const existing = await prfService.getPRFById(id);
    if (!existing) return res.status(404).json({ error: 'PRF not found.' });

    // Only the author or an authorized approver can update
    const canUpdate = req.user.role === 'Admin' || req.user.canApprove || req.user.canApprovePRF || req.user.canVerify || existing.authorId === req.user.id;
    if (!canUpdate) {
      return res.status(403).json({ error: 'You are not authorized to update this PRF.' });
    }

    if (validatedBody.status === 'Archived') {
      validatedBody.archivedBy = req.user.name || 'Unknown';
    } else if (validatedBody.status === 'Approved') {
      validatedBody.archivedBy = null;
    }

    const prf = await prfService.updatePRF(id, validatedBody);
    
    let actionType = 'UPDATE';
    let message = `${req.user.name || 'Unknown User'} updated PRF status to ${prf.status}`;

    if (prf.status === 'Approved') {
      actionType = 'APPROVE';
      message = `${req.user.name || 'Unknown User'} approved PRF`;
    } else if (prf.status === 'Archived') {
      actionType = 'ARCHIVE';
      message = `${req.user.name || 'Unknown User'} archived PRF`;
    }

    await activityService.logActivity(req.user.id, actionType, 'PRF', prf.id, message);

    res.json(prf);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: formatZodErrors(err) });
    }
    res.status(500).json({ error: err.message });
  }
};

const deletePRF = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid PRF ID.' });

    const existing = await prfService.getPRFById(id);
    if (!existing) return res.status(404).json({ error: 'PRF not found.' });

    // Only author or Admin can delete
    if (req.user.role !== 'Admin' && existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this PRF.' });
    }

    await prfService.deletePRF(id);
    await activityService.logActivity(
      req.user.id, 
      'DELETE', 
      'PRF', 
      id, 
      `${req.user.name || 'Unknown User'} permanently deleted PRF`
    );
    res.json({ message: 'PRF deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPRF, getPRFs, getPRFById, updatePRF, deletePRF };
