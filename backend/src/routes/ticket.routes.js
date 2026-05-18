const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.get('/schedule/driver', ticketController.getDriverSchedule);
router.get('/check-occupancy', ticketController.checkOccupancy);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
