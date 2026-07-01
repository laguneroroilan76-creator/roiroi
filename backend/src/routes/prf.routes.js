const express = require('express');
const router = express.Router();
const { createPRF, getPRFs, getPRFById, updatePRF, deletePRF, verifyPRF, approvePRF, rejectPRF, cancelPRF } = require('../controllers/prf.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { sanitizePayload } = require('../middleware/sanitizePayload.middleware');
const { verifyOwnershipOrRole } = require('../middleware/idor.middleware');

router.post('/', authenticateToken, sanitizePayload, createPRF);
router.get('/', authenticateToken, getPRFs);
router.get('/:id', authenticateToken, verifyOwnershipOrRole('prf'), getPRFById);
router.put('/:id', authenticateToken, verifyOwnershipOrRole('prf'), sanitizePayload, updatePRF);
router.delete('/:id', authenticateToken, verifyOwnershipOrRole('prf'), deletePRF);

// State Machine Workflow Endpoints
router.post('/:id/cancel', authenticateToken, cancelPRF);
router.post('/:id/verify', authenticateToken, verifyOwnershipOrRole('prf'), verifyPRF);
router.post('/:id/approve', authenticateToken, verifyOwnershipOrRole('prf'), approvePRF);
router.post('/:id/reject', authenticateToken, verifyOwnershipOrRole('prf'), rejectPRF);

module.exports = router;
