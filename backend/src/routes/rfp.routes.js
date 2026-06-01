const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfp.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { verifyOwnershipOrRole } = require('../middleware/authz.middleware');

router.use(authenticateToken);

router.post('/', rfpController.createRFP);
router.get('/', rfpController.getRFPs);
router.get('/:id', verifyOwnershipOrRole('Rrf', ['Admin', 'Approver', 'Verifier', 'Accounting']), rfpController.getRFPById);
router.put('/:id', verifyOwnershipOrRole('Rrf', ['Admin', 'Approver', 'Verifier', 'Accounting']), rfpController.updateRFP);
router.delete('/:id', verifyOwnershipOrRole('Rrf', ['Admin']), rfpController.deleteRFP);

// State Machine Workflow Endpoints
router.post('/:id/approve', verifyOwnershipOrRole('Rrf', ['Admin', 'Approver']), rfpController.approveRFP);
router.post('/:id/reject', verifyOwnershipOrRole('Rrf', ['Admin', 'Approver']), rfpController.rejectRFP);

module.exports = router;
