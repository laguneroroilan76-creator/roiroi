const supportService = require('../services/support.service');
const { supportTicketCreateSchema, supportTicketUpdateSchema, idParamSchema, formatZodErrors } = require('../utils/validation');

const createTicket = async (req, res) => {
  try {
    const validation = supportTicketCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: formatZodErrors(validation.error) });
    }
    
    const ticket = await supportService.createTicket(req.user.id, validation.data);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const tickets = await supportService.getTickets(req.user.id, req.user.role);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) return res.status(400).json({ error: formatZodErrors(paramValidation.error) });

    const ticket = await supportService.getTicketById(paramValidation.data.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Authorization check: Only IT/Admin or the author can view
    if (req.user.role !== 'IT' && req.user.role !== 'Admin' && ticket.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTicket = async (req, res) => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) return res.status(400).json({ error: formatZodErrors(paramValidation.error) });

    const validation = supportTicketUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: formatZodErrors(validation.error) });
    }

    const ticket = await supportService.getTicketById(paramValidation.data.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Authorization: Only IT/Admin can update status/assignment. Author can update content if Pending.
    const isIT = req.user.role === 'IT' || req.user.role === 'Admin';
    const isAuthor = ticket.authorId === req.user.id;

    if (!isIT && !isAuthor) return res.status(403).json({ error: 'Access denied' });
    
    // Standard users can only update if Pending
    if (!isIT && ticket.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot update ticket that is already being processed' });
    }

    const updated = await supportService.updateTicket(paramValidation.data.id, validation.data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) return res.status(400).json({ error: formatZodErrors(paramValidation.error) });

    const ticket = await supportService.getTicketById(paramValidation.data.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role !== 'Admin' && ticket.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await supportService.deleteTicket(paramValidation.data.id);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket };
