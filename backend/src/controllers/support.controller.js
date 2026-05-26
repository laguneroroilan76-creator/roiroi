const supportService = require('../services/support.service');
const { supportTicketCreateSchema, supportTicketUpdateSchema, idParamSchema, formatZodErrors } = require('../utils/validation');
const { createNotification } = require('./notification.controller');

const createTicket = async (req, res) => {
  try {
    const validation = supportTicketCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: formatZodErrors(validation.error) });
    }
    
    const ticket = await supportService.createTicket(req.user.id, validation.data);

    await createNotification({
      message: `${req.user.name || 'A user'} submitted a new Support Ticket: ${ticket.subject}`,
      type: 'NEW_SUPPORT',
      targetRole: 'IT',
      link: '/support'
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const hasSupportAccess = req.user.role === 'IT' || req.user.role === 'Admin'; 
    const tickets = await supportService.getTickets(req.user.id, req.user.role, hasSupportAccess);
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
    
    const hasSupportAccess = req.user.role === 'IT' || req.user.role === 'Admin';
    
    // Authorization check: Only IT/Admin/Support-permitted or the author can view
    if (!hasSupportAccess && ticket.authorId !== req.user.id) {
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

    // Authorization: Only IT/Admin/Support-permitted can update status/assignment. Author can update content if Pending.
    const hasSupportEdit = req.user.role === 'IT' || req.user.role === 'Admin';
    const isAuthor = ticket.authorId === req.user.id;

    if (!hasSupportEdit && !isAuthor) return res.status(403).json({ error: 'Access denied' });
    
    // Standard users (who are not Support) can only update if Pending
    if (!hasSupportEdit && ticket.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot update ticket that is already being processed' });
    }

    const updateData = { ...validation.data };
    if (updateData.status === 'Resolved') {
      updateData.resolvedById = req.user.id;
    }

    const updated = await supportService.updateTicket(paramValidation.data.id, updateData);
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

const getMessages = async (req, res) => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) return res.status(400).json({ error: formatZodErrors(paramValidation.error) });

    const ticketId = paramValidation.data.id;
    const ticket = await supportService.getTicketById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const hasSupportAccess = req.user.role === 'IT' || req.user.role === 'Admin';
    
    if (!hasSupportAccess && ticket.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await supportService.getMessages(ticketId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMessage = async (req, res) => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) return res.status(400).json({ error: formatZodErrors(paramValidation.error) });

    const ticketId = paramValidation.data.id;
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const ticket = await supportService.getTicketById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const hasSupportAccess = req.user.role === 'IT' || req.user.role === 'Admin';
    
    if (!hasSupportAccess && ticket.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newMessage = await supportService.addMessage(ticketId, req.user.id, message);
    
    try {
      const io = require('../utils/socket').getIO();
      io.to(`ticket_${ticketId}`).emit('new_message', newMessage);
    } catch (socketErr) {
      console.error('Socket error:', socketErr);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getMessages, addMessage };
