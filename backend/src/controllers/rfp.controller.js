const rfpService = require('../services/rfp.service');
const activityService = require('../services/activity.service');
const { createNotification } = require('./notification.controller');

const createRFP = async (req, res) => {
  try {
    const rfp = await rfpService.createRRF(req.user.id, req.body);
    
    await activityService.logActivity(
      req.user.id, 
      'CREATE', 
      'RFP', 
      rfp.id, 
      `${req.user.name || 'Unknown User'} created an RFP (Form #${rfp.rrfNo || rfp.id})`
    );

    await createNotification({
      message: `${req.user.name || 'A user'} submitted a new RFP #${rfp.rrfNo || rfp.id}`,
      type: 'NEW_RFP',
      targetRole: 'RFP_Approver',
      link: '/forms/rfp'
    });
    
    res.status(201).json(rfp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRFPs = async (req, res) => {
  try {
    const hasAccess = req.user.canApprove || req.user.canApproveRFP || req.user.canApproveDeptHead || req.user.role === 'Accounting';
    const rfps = await rfpService.getRRFs(req.user.id, hasAccess, req.user.role);
    res.json(rfps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRFPById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid RFP ID.' });

    const rfp = await rfpService.getRRFById(id);
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });

    // Access control: Author, Admin/Approver, specific RFP role, or Accounting
    const hasAccess = req.user.canApprove || req.user.canApproveRFP || req.user.canApproveDeptHead || rfp.authorId === req.user.id || req.user.role === 'Accounting';
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(rfp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid RFP ID.' });

    const existing = await rfpService.getRRFById(id);
    if (!existing) return res.status(404).json({ error: 'RFP not found.' });

    // Only the author, an authorized approver, or Accounting can update
    const canUpdate = req.user.canApprove || req.user.canApproveRFP || req.user.canApproveDeptHead || existing.authorId === req.user.id || req.user.role === 'Accounting';
    if (!canUpdate) {
      return res.status(403).json({ error: 'You are not authorized to update this RFP.' });
    }

    if (req.body.status === 'Archived') {
      req.body.archivedBy = req.user.name || 'Unknown';
    } else if (req.body.status === 'Approved') {
      req.body.archivedBy = null; // Clear stale archive data
    }

    const rfp = await rfpService.updateRRF(id, req.body);
    
    let actionType = 'UPDATE';
    let message = `${req.user.name || 'Unknown User'} updated RFP #${rfp.rrfNo || rfp.id} status to ${rfp.status}`;

    if (rfp.status === 'Approved') {
      actionType = 'APPROVE';
      message = `${req.user.name || 'Unknown User'} approved RFP #${rfp.rrfNo || rfp.id}`;
      await createNotification({
        message: `Your RFP #${rfp.rrfNo || rfp.id} has been Approved`,
        type: 'APPROVED',
        targetUserId: rfp.authorId,
        link: '/history'
      });
    } else if (rfp.status === 'Archived') {
      actionType = 'ARCHIVE';
      message = `${req.user.name || 'Unknown User'} archived RFP #${rfp.rrfNo || rfp.id}`;
      await createNotification({
        message: `Your RFP #${rfp.rrfNo || rfp.id} was Rejected`,
        type: 'REJECTED',
        targetUserId: rfp.authorId,
        link: '/history'
      });
    } else if (rfp.status === 'Pending Dept Head Approval') {
      await createNotification({
        message: `RFP #${rfp.rrfNo || rfp.id} verified and pending Dept Head approval`,
        type: 'INFO',
        targetRole: 'DeptHead',
        link: '/pending'
      });
    } else if (rfp.status === 'Pending Final Approval') {
      await createNotification({
        message: `RFP #${rfp.rrfNo || rfp.id} pending Final Approval`,
        type: 'INFO',
        targetRole: 'RFP_Approver',
        link: '/pending'
      });
    }

    await activityService.logActivity(req.user.id, actionType, 'RFP', rfp.id, message);

    res.json(rfp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteRFP = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid RFP ID.' });

    const existing = await rfpService.getRRFById(id);
    if (!existing) return res.status(404).json({ error: 'RFP not found.' });

    // Only author or Admin can delete
    if (req.user.role !== 'Admin' && existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this RFP.' });
    }

    await rfpService.deleteRRF(id);
    await activityService.logActivity(
      req.user.id, 
      'DELETE', 
      'RFP', 
      id, 
      `${req.user.name || 'Unknown User'} permanently deleted RFP #${id}`
    );
    res.json({ message: 'RFP deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createRFP, getRFPs, getRFPById, updateRFP, deleteRFP };
