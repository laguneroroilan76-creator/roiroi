const cron = require('node-cron');
const consistencyService = require('../services/consistency.service');

const initConsistencyJob = () => {
  // Run every 6 hours (0 */6 * * *)
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Running Consistency Scan...');
    try {
      // Safe fix mode can be toggled via ENV var, default to false for cron to prevent unexpected behavior
      const safeFix = process.env.AUTO_REPAIR_ENABLED === 'true';
      const report = await consistencyService.runIntegrityScan(safeFix);
      
      const totalErrors = report.prf.errors.length + report.rfp.errors.length + report.tripTicket.errors.length;
      const totalFixed = report.prf.fixed.length + report.rfp.fixed.length + report.tripTicket.fixed.length;

      console.log(`[CRON] Consistency Scan Complete. Errors: ${totalErrors}, Fixed: ${totalFixed}`);
      
      if (totalErrors > 0 && !safeFix) {
        console.warn('[CRON] WARNING: Integrity errors detected. Run manual safe-fix scan.');
      }
    } catch (error) {
      console.error('[CRON] Error during Consistency Scan:', error);
    }
  });
};

module.exports = { initConsistencyJob };
