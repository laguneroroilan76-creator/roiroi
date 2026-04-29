const prfService = require('../services/prf.service');
const activityService = require('../services/activity.service');

const createPRF = async (req, res) => {
  try {
    const prf = await prfService.createPRF(req.user.id, req.body);
    
    await activityService.logActivity(
      req.user.id, 
      'CREATE', 
      'PRF', 
      prf.id, 
      `${req.user.name || 'Unknown User'} created PRF #${prf.prfNo || prf.id}`
    );
    
    res.status(201).json(prf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPRFs = async (req, res) => {
  try {
    const prfs = await prfService.getPRFs(req.user.id, req.user.canApprove, req.user.role === 'Guard');
    res.json(prfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPRFById = async (req, res) => {
  try {
    const prf = await prfService.getPRFById(req.params.id);
    if (!prf) return res.status(404).json({ error: 'PRF not found' });
    res.json(prf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePRF = async (req, res) => {
  try {
    if (req.body.status === 'Archived') {
      req.body.archivedBy = req.user.name || 'Unknown';
    } else if (req.body.status === 'Approved') {
      req.body.archivedBy = null;
    }

    const prf = await prfService.updatePRF(req.params.id, req.body);
    
    let actionType = 'UPDATE';
    let message = `${req.user.name || 'Unknown User'} updated PRF status to ${prf.status}`;

    if (prf.status === 'Approved') {
      actionType = 'APPROVE';
      message = `${req.user.name || 'Unknown User'} approved PRF`;
    } else if (prf.status === 'Archived') {
      actionType = 'ARCHIVE';
      message = `${req.user.name || 'Unknown User'} archived PRF`;
    }

    await activityService.logActivity(
      req.user.id, 
      actionType, 
      'PRF', 
      prf.id, 
      message
    );

    res.json(prf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePRF = async (req, res) => {
  try {
    await prfService.deletePRF(req.params.id);
    await activityService.logActivity(
      req.user.id, 
      'DELETE', 
      'PRF', 
      parseInt(req.params.id), 
      `${req.user.name || 'Unknown User'} permanently deleted PRF`
    );
    res.json({ message: 'PRF deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPRF, getPRFs, getPRFById, updatePRF, deletePRF };
