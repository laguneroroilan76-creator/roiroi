const rrfService = require('../services/rrf.service');
const activityService = require('../services/activity.service');

const createRRF = async (req, res) => {
  try {
    const rrf = await rrfService.createRRF(req.user.id, req.body);
    
    await activityService.logActivity(
      req.user.id, 
      'CREATE', 
      'RRF', 
      rrf.id, 
      `${req.user.name || 'Unknown User'} created RRF #${rrf.rrfNo || rrf.id}`
    );
    
    res.status(201).json(rrf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRRFs = async (req, res) => {
  try {
    const rrfs = await rrfService.getRRFs(req.user.id, req.user.canApprove, req.user.role === 'Guard');
    res.json(rrfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRRFById = async (req, res) => {
  try {
    const rrf = await rrfService.getRRFById(req.params.id);
    if (!rrf) return res.status(404).json({ error: 'RRF not found' });
    res.json(rrf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateRRF = async (req, res) => {
  try {
    if (req.body.status === 'Archived') {
      req.body.archivedBy = req.user.name || 'Unknown';
    } else if (req.body.status === 'Approved') {
      req.body.archivedBy = null;
    }

    const rrf = await rrfService.updateRRF(req.params.id, req.body);
    
    let actionType = 'UPDATE';
    let message = `${req.user.name || 'Unknown User'} updated RRF status to ${rrf.status}`;

    if (rrf.status === 'Approved') {
      actionType = 'APPROVE';
      message = `${req.user.name || 'Unknown User'} approved RRF`;
    } else if (rrf.status === 'Archived') {
      actionType = 'ARCHIVE';
      message = `${req.user.name || 'Unknown User'} archived RRF`;
    }

    await activityService.logActivity(
      req.user.id, 
      actionType, 
      'RRF', 
      rrf.id, 
      message
    );

    res.json(rrf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteRRF = async (req, res) => {
  try {
    await rrfService.deleteRRF(req.params.id);
    await activityService.logActivity(
      req.user.id, 
      'DELETE', 
      'RRF', 
      parseInt(req.params.id), 
      `${req.user.name || 'Unknown User'} permanently deleted RRF`
    );
    res.json({ message: 'RRF deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createRRF, getRRFs, getRRFById, updateRRF, deleteRRF };
