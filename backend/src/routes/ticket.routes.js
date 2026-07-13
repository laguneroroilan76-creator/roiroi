const express = require('express');
const router = express.Router();
const { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getDriverSchedule, checkOccupancy, endorseTicket, approveTicket, rejectTicket, cancelTicket, getTicketWorkflowTargets, backfillWorkflowTargets } = require('../controllers/ticket.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { sanitizePayload } = require('../middleware/sanitizePayload.middleware');
const { verifyOwnershipOrRole } = require('../middleware/idor.middleware');

router.post('/', authenticateToken, sanitizePayload, createTicket);
router.get('/', authenticateToken, getTickets);
router.get('/schedule/driver', authenticateToken, getDriverSchedule);
router.get('/check-occupancy', authenticateToken, checkOccupancy);
router.post('/backfill-workflow-targets', authenticateToken, backfillWorkflowTargets);
router.get('/:id/workflow-targets', authenticateToken, getTicketWorkflowTargets);
router.get('/:id', authenticateToken, verifyOwnershipOrRole('tripTicket'), getTicketById);
router.put('/:id', authenticateToken, verifyOwnershipOrRole('tripTicket'), sanitizePayload, updateTicket);
router.delete('/:id', authenticateToken, verifyOwnershipOrRole('tripTicket'), deleteTicket);

// State Machine Workflow Endpoints
router.post('/:id/cancel', authenticateToken, cancelTicket);
router.post('/:id/endorse', authenticateToken, verifyOwnershipOrRole('tripTicket'), endorseTicket);
router.post('/:id/approve', authenticateToken, verifyOwnershipOrRole('tripTicket'), approveTicket);
router.post('/:id/reject', authenticateToken, verifyOwnershipOrRole('tripTicket'), rejectTicket);

module.exports = router;
