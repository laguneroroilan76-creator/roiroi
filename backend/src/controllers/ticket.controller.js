const ticketService = require('../services/ticket.service');
const activityService = require('../services/activity.service');
const { createNotification } = require('./notification.controller');
const prisma = require('../config/database');
const { ticketCreateBodySchema, validateTripTicketDates } = require('../utils/validation');
const auditService = require('../services/audit.service');
const { transition } = require('../workflow/workflow.engine');

const normalizePassengerValue = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
};

const getVehicleCapacityLimit = async (vehicleName) => {
  if (!vehicleName) return null;
  const vehicle = await prisma.vehicle.findFirst({ where: { name: vehicleName } });
  if (!vehicle || vehicle.capacity == null) return null;
  return Math.max(0, vehicle.capacity - 1);
};

const ensurePassengerCountAndCapacity = async (data, existingData = {}) => {
  const hdi = normalizePassengerValue(data.hdiPassengers ?? existingData.hdiPassengers);
  const outside = normalizePassengerValue(data.outsidePassengers ?? existingData.outsidePassengers);
  if (hdi === null || outside === null) {
    throw buildValidationError([{ path: ['passengers'], message: 'Passenger counts must be non-negative whole numbers.' }]);
  }

  data.hdiPassengers = String(hdi);
  data.outsidePassengers = String(outside);
  data.passengerCount = String(hdi + outside);

  const vehicleName = data.vehicle ?? existingData.vehicle;
  if (vehicleName) {
    const maxPassengers = await getVehicleCapacityLimit(vehicleName);
    if (maxPassengers !== null && hdi + outside > maxPassengers) {
      throw buildValidationError([{ path: ['vehicle'], message: `Vehicle capacity exceeded. Selected vehicle can carry up to ${maxPassengers} passenger(s) excluding the driver.` }]);
    }
  }
};

const sanitizePayload = async (payload, reqUser) => {
  const data = { ...payload };
  
  // Only set date fields if they were actually in the payload
  if ('dateRequested' in data) {
    data.dateRequested = data.dateRequested ? new Date(data.dateRequested) : null;
  }
  if ('dateTimeDeparture' in data) {
    data.dateTimeDeparture = data.dateTimeDeparture ? new Date(data.dateTimeDeparture) : null;
  }
  if ('dateTimeReturn' in data) {
    data.dateTimeReturn = data.dateTimeReturn ? new Date(data.dateTimeReturn) : null;
  }

  const resolveUserId = async (nameOrId) => {
    if (!nameOrId) return null;
    if (!isNaN(nameOrId)) return Number(nameOrId);
    const u = await prisma.user.findFirst({ where: { name: String(nameOrId) } });
    return u ? u.id : null;
  };

  if (data.requestorName) data.requestorId = await resolveUserId(data.requestorName);
  if (data.driver) data.driverId = await resolveUserId(data.driver);
  if (data.requestedBy) data.requestedById = await resolveUserId(data.requestedBy);
  if (data.endorsedBy) data.endorsedById = await resolveUserId(data.endorsedBy);
  if (data.approvedBy) data.approvedById = await resolveUserId(data.approvedBy);
  if (data.guardIn) data.guardInId = await resolveUserId(data.guardIn);
  if (data.guardOut) data.guardOutId = await resolveUserId(data.guardOut);

  if (data.vehicleId !== undefined && data.vehicleId !== null && data.vehicleId !== '' && data.vehicleId !== 0) {
    data.vehicleId = Number(data.vehicleId);
  } else {
    delete data.vehicleId;
  }
  
  delete data.requestorName;
  delete data.driver;
  delete data.requestedBy;
  delete data.endorsedBy;
  delete data.approvedBy;
  delete data.guardIn;
  delete data.guardOut;
  delete data.archivedBy;
  delete data.status;
  
  return data;
};

const buildValidationError = (errors) => {
  const error = new Error(errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', '));
  error.statusCode = 400;
  return error;
};

const resolveTripTicketWorkflowTargets = async (ticket, user) => {
  const requestorId = ticket.requestorId || ticket.authorId;
  const requestor = requestorId
    ? await prisma.user.findUnique({ where: { id: requestorId }, include: { department: true, company: true } })
    : null;

  const vehicle = ticket.vehicleId
    ? await prisma.vehicle.findUnique({ where: { id: ticket.vehicleId }, include: { company: true, department: true } })
    : null;

  const findDepartmentHead = async (departmentId) => {
    if (!departmentId) return null;
    return prisma.user.findFirst({ where: { departmentId, departmentRole: 'DepartmentHead' } });
  };

  const findImmediateSupervisor = async (departmentId) => {
    if (!departmentId) return null;
    return prisma.user.findFirst({ where: { departmentId, departmentRole: 'ImmediateSupervisor' } });
  };

  const findPresident = async () =>
    prisma.user.findFirst({ where: { departmentRole: 'President' } });

  const findAdminDepartmentHead = async () =>
    prisma.user.findFirst({ where: { departmentRole: 'DepartmentHead', department: { name: 'Admin' } } });

  const requestorDeptId = requestor?.departmentId ?? null;
  const vehicleDeptId = vehicle?.departmentId ?? vehicle?.department?.id ?? null;

  const deptHeadForRequestor = await findDepartmentHead(requestorDeptId);
  const deptHeadForVehicle = await findDepartmentHead(vehicleDeptId);
  const immediateSupervisor = await findImmediateSupervisor(requestorDeptId);
  const president = await findPresident();
  const adminDeptHead = await findAdminDepartmentHead();

  let expectedEndorser = null;
  let expectedApprover = null;

  const role = requestor?.departmentRole;

  if (role === 'Staff') {
    // Endorser: IS if exists in dept, else Dept Head
    expectedEndorser = immediateSupervisor || deptHeadForRequestor;
    // Approver: always vehicle's Dept Head
    expectedApprover = deptHeadForVehicle;
  } else if (role === 'ImmediateSupervisor') {
    expectedEndorser = deptHeadForRequestor;
    expectedApprover = deptHeadForVehicle;
  } else if (role === 'DepartmentHead') {
    expectedEndorser = president;
    expectedApprover = deptHeadForVehicle;
  } else if (role === 'President') {
    expectedEndorser = adminDeptHead;
    expectedApprover = deptHeadForVehicle;
  }

  return { expectedEndorser, expectedApprover };
};

const getTicketWorkflowTargets = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await prisma.tripTicket.findUnique({
      where: { id },
      include: {
        vehicleRef: { include: { company: true, department: true } },
        requestor: { include: { department: true, company: true } }
      }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    const targets = await resolveTripTicketWorkflowTargets(ticket, req.user);
    res.json({
      expectedEndorser: targets.expectedEndorser ? { id: targets.expectedEndorser.id, name: targets.expectedEndorser.name } : null,
      expectedApprover: targets.expectedApprover ? { id: targets.expectedApprover.id, name: targets.expectedApprover.name } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const validatedBody = ticketCreateBodySchema.parse(req.body);
    const validationErrors = validateTripTicketDates(validatedBody);
    if (validationErrors.length) throw buildValidationError(validationErrors);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);
    sanitizedData.authorId = req.user.id;
    sanitizedData.requestedById = req.user.id;
    sanitizedData.requestorId = req.user.id;

    // Resolve and store expected endorser and approver at creation
    try {
      const targets = await resolveTripTicketWorkflowTargets(sanitizedData, req.user);
      if (targets.expectedEndorser) sanitizedData.endorsedById = targets.expectedEndorser.id;
      if (targets.expectedApprover) sanitizedData.approvedById = targets.expectedApprover.id;
    } catch (e) {
      console.warn('Could not resolve workflow targets at creation:', e.message);
    }

    await ensurePassengerCountAndCapacity(sanitizedData);

    // Prevent non-Guard users from setting guard-only or actual travel log fields on create
    const guardedFields = ['kmOut', 'kmIn', 'guardOutId', 'guardInId', 'dateTimeDeparture', 'dateTimeReturn'];
    if (req.user.role !== 'Guard') {
      guardedFields.forEach((f) => delete sanitizedData[f]);
    }

    const ticket = await prisma.$transaction(async (tx) => {
      if (!sanitizedData.status) sanitizedData.status = 'Pending Endorsement';
      const created = await tx.tripTicket.create({ data: sanitizedData });
      await auditService.log(tx, {
        userId: req.user.id, action: 'CREATE', tableName: 'TripTicket', recordId: created.id, newValues: created, ipAddress: req.ip
      });
      return created;
    });

    await createNotification({ message: `${req.user.name || 'A user'} submitted a new Trip Ticket`, type: 'NEW_TRIPTICKET', targetRole: 'TripTicket_Approver', link: '/forms/tripticket' });
    res.status(201).json(ticket);
  } catch (err) {
    if (err.name === 'ZodError' || err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const hasAccess = req.user.role === 'Admin' ||
      req.user.departmentRole === 'President' ||
      req.user.departmentRole === 'DepartmentHead' ||
      req.user.departmentRole === 'ImmediateSupervisor';
    const tickets = await ticketService.getTickets(req.user.id, hasAccess, req.user.role === 'Guard');
    res.json(tickets);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(parseInt(req.params.id), req.user);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    if (err.name === 'ZodError' || err.statusCode === 400) return res.status(400).json({ error: err.message });
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const updateTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = ticketCreateBodySchema.parse(req.body);
    const validationErrors = validateTripTicketDates(validatedBody);
    if (validationErrors.length) throw buildValidationError(validationErrors);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);
    delete sanitizedData.requestedById;

    // Get the existing ticket to check status and permissions
    const existingTicket = await prisma.tripTicket.findUnique({ where: { id } });
    if (!existingTicket) return res.status(404).json({ error: 'Ticket not found' });

    // If ticket is ARRIVED, no one can edit
    if (existingTicket.status === 'ARRIVED') {
      return res.status(403).json({ error: 'Cannot edit an arrived trip ticket.' });
    }

    // Guards can only edit during travel phases (Approved, DEPARTED) and only KM/guard fields
    if (req.user.role === 'Guard') {
      const guardAllowed = ['kmOut', 'kmIn', 'guardOutId', 'guardInId', 'dateTimeDeparture', 'dateTimeReturn', 'status'];
      const attemptedFields = Object.keys(sanitizedData).filter(f => sanitizedData[f] != null);
      const hasForbidden = attemptedFields.some((f) => !guardAllowed.includes(f));
      if (hasForbidden) return res.status(403).json({ error: 'Guard users can only update checkpoint fields.' });
      
      // Guards can only edit during Approved or DEPARTED status
      if (!['Approved', 'DEPARTED'].includes(existingTicket.status)) {
        return res.status(403).json({ error: 'Guards can only update during travel phases.' });
      }
    }
    // Non-guards (approvers/admins) can edit during Pending stages
    else if (['Pending Endorsement', 'Pending Approval'].includes(existingTicket.status)) {
      // Approvers can edit during endorsement/approval stages - allowed
    }
    // Non-guards cannot edit once ticket is Approved or in travel
    else if (['Approved', 'DEPARTED'].includes(existingTicket.status)) {
      return res.status(403).json({ error: 'Only guards can edit approved/in-transit tickets.' });
    }
    else {
      return res.status(403).json({ error: 'Cannot edit this ticket at this stage.' });
    }

    if (req.user.role !== 'Guard') {
      await ensurePassengerCountAndCapacity(sanitizedData, existingTicket);
    }

    if (req.user.role === 'Guard') {
      if (sanitizedData.dateTimeDeparture && !sanitizedData.dateTimeReturn && existingTicket.status === 'Approved') {
        sanitizedData.status = 'DEPARTED';
      } else if (sanitizedData.dateTimeReturn && existingTicket.status === 'DEPARTED') {
        sanitizedData.status = 'ARRIVED';
      }
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.tripTicket.findUnique({ where: { id } });
      const updated = await tx.tripTicket.update({ where: { id }, data: sanitizedData });
      await auditService.log(tx, {
        userId: req.user.id, action: 'UPDATE', tableName: 'TripTicket', recordId: id, oldValues: oldRecord, newValues: updated, ipAddress: req.ip
      });
      return updated;
    });

    res.json(ticket);
  } catch (err) {
    if (err.name === 'ZodError' || err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await ticketService.deleteTicket(id);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const cancelTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await prisma.tripTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    if (ticket.authorId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only the author can cancel this request' });
    }

    if (ticket.status === 'Approved' || ticket.status === 'DEPARTED' || ticket.status === 'ARRIVED' || ticket.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel an already processed request' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tripTicket.update({
        where: { id },
        data: { status: 'Cancelled' }
      });
      await auditService.log(tx, {
        userId: req.user.id, action: 'CANCEL', tableName: 'TripTicket', recordId: id, oldValues: ticket, newValues: result, ipAddress: req.ip
      });
      return result;
    });

    res.json(updated);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const getDriverSchedule = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.canApprove;
    const driverName = req.user.name;
    const tickets = await ticketService.getDriverSchedule(driverName, isAdmin);
    res.json(tickets);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const checkOccupancy = async (req, res) => {
  try {
    const { start, end } = req.query;
    const occupied = await ticketService.getOccupiedResources(start, end);
    res.json(occupied);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};


const endorseTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? ticketCreateBodySchema.parse(req.body) : {};
    const validationErrors = validateTripTicketDates(validatedBody);
    if (validationErrors.length) throw buildValidationError(validationErrors);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const guardedFields = ['kmOut', 'kmIn', 'guardOutId', 'guardInId', 'dateTimeDeparture', 'dateTimeReturn'];
    if (req.user.role !== 'Guard') {
      guardedFields.forEach((f) => delete sanitizedData[f]);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.tripTicket.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');

      const workflowTargets = await resolveTripTicketWorkflowTargets(oldRecord, req.user);
      const tResult = transition({
        entity: 'tripTicket',
        currentStatus: oldRecord.status,
        action: 'endorse',
        user: req.user,
        context: workflowTargets
      });
      if (!tResult.allowed) throw new Error(tResult.error);
      
      const updateResult = await tx.tripTicket.updateMany({
        where: { id, status: oldRecord.status },
        data: {
          ...sanitizedData,
          status: tResult.nextStatus,
          ...tResult.sideEffects
        }
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      const updatedRecord = await tx.tripTicket.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'ENDORSE', tableName: 'TripTicket', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError' || err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const approveTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? ticketCreateBodySchema.parse(req.body) : {};
    const validationErrors = validateTripTicketDates(validatedBody);
    if (validationErrors.length) throw buildValidationError(validationErrors);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const guardedFields = ['kmOut', 'kmIn', 'guardOutId', 'guardInId', 'dateTimeDeparture', 'dateTimeReturn'];
    if (req.user.role !== 'Guard') {
      guardedFields.forEach((f) => delete sanitizedData[f]);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.tripTicket.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');

      const workflowTargets = await resolveTripTicketWorkflowTargets(oldRecord, req.user);
      const tResult = transition({
        entity: 'tripTicket',
        currentStatus: oldRecord.status,
        action: 'approve',
        user: req.user,
        context: workflowTargets
      });
      if (!tResult.allowed) throw new Error(tResult.error);
      
      const updateResult = await tx.tripTicket.updateMany({
        where: { id, status: oldRecord.status },
        data: {
          ...sanitizedData,
          status: tResult.nextStatus,
          ...tResult.sideEffects
        }
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      const updatedRecord = await tx.tripTicket.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'APPROVE', tableName: 'TripTicket', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError' || err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const rejectTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedBody = Object.keys(req.body).length > 0 ? ticketCreateBodySchema.parse(req.body) : {};
    const validationErrors = validateTripTicketDates(validatedBody);
    if (validationErrors.length) throw buildValidationError(validationErrors);
    const sanitizedData = await sanitizePayload(validatedBody, req.user);

    const guardedFields = ['kmOut', 'kmIn', 'guardOutId', 'guardInId', 'dateTimeDeparture', 'dateTimeReturn'];
    if (req.user.role !== 'Guard') {
      guardedFields.forEach((f) => delete sanitizedData[f]);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.tripTicket.findUnique({ where: { id } });
      if (!oldRecord) throw new Error('Record not found');

      const workflowTargets = await resolveTripTicketWorkflowTargets(oldRecord, req.user);
      const tResult = transition({
        entity: 'tripTicket',
        currentStatus: oldRecord.status,
        action: 'reject',
        user: req.user,
        context: workflowTargets
      });
      if (!tResult.allowed) throw new Error(tResult.error);
      
      const updateResult = await tx.tripTicket.updateMany({
        where: { id, status: oldRecord.status },
        data: {
          ...sanitizedData,
          status: tResult.nextStatus,
          ...tResult.sideEffects,
          disapprovalReason: req.body.disapprovalReason || req.body.reason || 'Rejected'
        }
      });

      if (updateResult.count === 0) {
        throw Object.assign(new Error("Invalid or stale workflow state"), { statusCode: 409 });
      }

      const updatedRecord = await tx.tripTicket.findUnique({ where: { id } });

      await auditService.log(tx, {
        userId: req.user.id, action: 'REJECT', tableName: 'TripTicket', recordId: id, oldValues: oldRecord, newValues: updatedRecord, ipAddress: req.ip
      });
      return updatedRecord;
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError' || err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const backfillWorkflowTargets = async (req, res) => {
  try {
    // Only Admin or President can run this
    if (req.user.role !== 'Admin' && req.user.departmentRole !== 'President') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const tickets = await prisma.tripTicket.findMany({
      where: {
        status: { in: ['Pending Endorsement', 'Endorsed'] },
        OR: [{ endorsedById: null }, { approvedById: null }]
      },
      include: {
        vehicleRef: { include: { company: true, department: true } },
        requestor: { include: { department: true, company: true } }
      }
    });

    let updated = 0;
    for (const ticket of tickets) {
      const targets = await resolveTripTicketWorkflowTargets(ticket, req.user);
      if (targets.expectedEndorser || targets.expectedApprover) {
        await prisma.tripTicket.update({
          where: { id: ticket.id },
          data: {
            ...(targets.expectedEndorser && { endorsedById: targets.expectedEndorser.id }),
            ...(targets.expectedApprover && { approvedById: targets.expectedApprover.id }),
          }
        });
        updated++;
      }
    }

    res.json({ message: `Backfilled ${updated} tickets`, total: tickets.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  cancelTicket,
  getDriverSchedule,
  checkOccupancy,
  endorseTicket,
  approveTicket,
  rejectTicket,
  getTicketWorkflowTargets,
  backfillWorkflowTargets
};
