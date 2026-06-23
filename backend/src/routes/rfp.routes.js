const express = require('express');
const router = express.Router();
const { createRFP, getRFPs, getRFPById, updateRFP, deleteRFP, approveRFP, approveDeptRFP, rejectRFP, cancelRFP, receiveRFP } = require('../controllers/rfp.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { sanitizePayload } = require('../middleware/sanitizePayload.middleware');
const { verifyOwnershipOrRole } = require('../middleware/idor.middleware');

router.post('/', authenticateToken, sanitizePayload, createRFP);
router.get('/', authenticateToken, getRFPs);
router.get('/:id', authenticateToken, verifyOwnershipOrRole('rfp'), getRFPById);
router.put('/:id', authenticateToken, verifyOwnershipOrRole('rfp'), sanitizePayload, updateRFP);
router.delete('/:id', authenticateToken, verifyOwnershipOrRole('rfp'), deleteRFP);

// State Machine Workflow Endpoints
router.post('/:id/cancel', authenticateToken, cancelRFP);
router.post('/:id/approve', authenticateToken, verifyOwnershipOrRole('rfp'), approveRFP);
router.post('/:id/approve_dept', authenticateToken, verifyOwnershipOrRole('rfp'), approveDeptRFP);
router.post('/:id/receive', authenticateToken, verifyOwnershipOrRole('rfp'), receiveRFP);
router.post('/:id/reject', authenticateToken, verifyOwnershipOrRole('rfp'), rejectRFP);

module.exports = router;
