const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', supportController.createTicket);
router.get('/', supportController.getTickets);
router.get('/:id', supportController.getTicketById);
router.put('/:id', supportController.updateTicket);
router.delete('/:id', supportController.deleteTicket);

router.get('/:id/messages', supportController.getMessages);
router.post('/:id/messages', supportController.addMessage);

module.exports = router;
