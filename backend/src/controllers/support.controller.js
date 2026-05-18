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
    const permissions = typeof req.user.permissions === 'string' ? JSON.parse(req.user.permissions) : (req.user.permissions || {});
    const hasSupportAccess = req.user.role === 'IT' || req.user.role === 'Admin' || permissions?.support?.view || permissions?.support?.edit;
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
    
    const permissions = typeof req.user.permissions === 'string' ? JSON.parse(req.user.permissions) : (req.user.permissions || {});
    const hasSupportAccess = req.user.role === 'IT' || req.user.role === 'Admin' || permissions?.support?.view || permissions?.support?.edit;
    
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
    const permissions = typeof req.user.permissions === 'string' ? JSON.parse(req.user.permissions) : (req.user.permissions || {});
    const hasSupportEdit = req.user.role === 'IT' || req.user.role === 'Admin' || permissions?.support?.edit;
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

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket };
