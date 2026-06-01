const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { verifyOwnershipOrRole } = require('../middleware/authz.middleware');

router.use(authenticateToken);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.get('/schedule/driver', ticketController.getDriverSchedule);
router.get('/check-occupancy', ticketController.checkOccupancy);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', verifyOwnershipOrRole('TripTicket', ['Admin', 'Approver', 'Guard']), ticketController.updateTicket);
router.delete('/:id', verifyOwnershipOrRole('TripTicket', ['Admin']), ticketController.deleteTicket);

// State Machine Workflow Endpoints
router.post('/:id/endorse', verifyOwnershipOrRole('TripTicket', ['Admin', 'Approver']), ticketController.endorseTicket);
router.post('/:id/approve', verifyOwnershipOrRole('TripTicket', ['Admin', 'Approver']), ticketController.approveTicket);
router.post('/:id/reject', verifyOwnershipOrRole('TripTicket', ['Admin', 'Approver']), ticketController.rejectTicket);

module.exports = router;
