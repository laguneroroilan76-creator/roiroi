const consistencyService = require('../services/consistency.service');

const runConsistencyScan = async (req, res) => {
  try {
    const safeFix = req.query.repair === 'true';
    const report = await consistencyService.runIntegrityScan(safeFix);
    
    res.json({
      success: true,
      mode: safeFix ? 'REPAIR' : 'SCAN_ONLY',
      report
    });
  } catch (error) {
    console.error('Consistency Scan Error:', error);
    res.status(500).json({ error: 'Internal Server Error during consistency scan' });
  }
};

module.exports = {
  runConsistencyScan
};
