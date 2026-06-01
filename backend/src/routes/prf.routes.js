const express = require('express');
const router = express.Router();
const prfController = require('../controllers/prf.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { verifyRole, verifyOwnershipOrRole } = require('../middleware/authz.middleware');

router.use(authenticateToken);

router.post('/', prfController.createPRF);
router.get('/', prfController.getPRFs);
router.get('/:id', verifyOwnershipOrRole('Prf', ['Admin', 'Approver', 'Verifier']), prfController.getPRFById);
router.put('/:id', verifyOwnershipOrRole('Prf', ['Admin', 'Approver', 'Verifier']), prfController.updatePRF);
router.delete('/:id', verifyOwnershipOrRole('Prf', ['Admin']), prfController.deletePRF);

// State Machine Workflow Endpoints
router.post('/:id/verify', verifyOwnershipOrRole('Prf', ['Admin', 'Verifier']), prfController.verifyPRF);
router.post('/:id/approve', verifyOwnershipOrRole('Prf', ['Admin', 'Approver']), prfController.approvePRF);
router.post('/:id/reject', verifyOwnershipOrRole('Prf', ['Admin', 'Approver', 'Verifier']), prfController.rejectPRF);

module.exports = router;
