const ticketService = require('../services/ticket.service');
const activityService = require('../services/activity.service');

const createTicket = async (req, res) => {
  try {
    // Prevent non-Guard users from setting guard-only or actual travel log fields on create
    const guardedFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'];
    const payload = { ...req.body };
    if (req.user.role !== 'Guard') {
      guardedFields.forEach((f) => delete payload[f]);
    }

    const ticket = await ticketService.createTicket(req.user.id, payload);
    
    await activityService.logActivity(
      req.user.id, 
      'CREATE', 
      'TRIP_TICKET', 
      ticket.id, 
      `${req.user.name || 'Unknown User'} created Trip Ticket for ${ticket.requestorName || 'N/A'}`
    );
    
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getTickets(req.user.id, req.user.canApprove, req.user.role === 'Guard');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTicket = async (req, res) => {
  try {
    // Guard users can only update checkpoint, actual-travel fields, and status
    const guardAllowed = ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn', 'status'];

    if (req.user.role === 'Guard') {
      const attemptedFields = Object.keys(req.body || {});
      const hasForbidden = attemptedFields.some((f) => !guardAllowed.includes(f));
      if (hasForbidden) {
        return res.status(403).json({ error: 'Guard users can only update checkpoint and actual travel log fields.' });
      }
    }
    // Non-guards (Admins/Approvers) can now update both status and guarded fields.

    if (req.body.status === 'Archived') {
      req.body.archivedBy = req.user.name || 'Unknown';
    } else if (req.body.status === 'Approved') {
      req.body.archivedBy = null;
    }

    const ticket = await ticketService.updateTicket(req.params.id, req.body);
    
    let actionType = 'UPDATE';
    let message = `${req.user.name || 'Unknown User'} updated status to ${ticket.status}`;

    if (req.user.role === 'Guard') {
      actionType = 'UPDATE';
      message = `${req.user.name || 'Unknown User'} updated Trip Ticket guard log`;
    }

    if (req.user.role !== 'Guard' && ticket.status === 'Approved') {
      actionType = 'APPROVE';
      message = `${req.user.name || 'Unknown User'} approved Trip Ticket`;
    } else if (req.user.role !== 'Guard' && ticket.status === 'Archived') {
      actionType = 'ARCHIVE';
      message = `${req.user.name || 'Unknown User'} archived Trip Ticket`;
    }

    await activityService.logActivity(
      req.user.id, 
      actionType, 
      'TRIP_TICKET', 
      ticket.id, 
      message
    );

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTicket = async (req, res) => {
  try {
    await ticketService.deleteTicket(req.params.id);
    await activityService.logActivity(
      req.user.id, 
      'DELETE', 
      'TRIP_TICKET', 
      parseInt(req.params.id), 
      `${req.user.name || 'Unknown User'} permanently deleted Trip Ticket`
    );
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDriverSchedule = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.canApprove;
    const driverName = req.user.name;
    const tickets = await ticketService.getDriverSchedule(driverName, isAdmin);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkOccupancy = async (req, res) => {
  try {
    const { start, end } = req.query;
    const occupied = await ticketService.getOccupiedResources(start, end);
    res.json(occupied);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getDriverSchedule, checkOccupancy };
