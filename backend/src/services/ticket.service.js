const prisma = require('../config/database');

const createTicket = async (userId, ticketData) => {
  const allowedFields = [
    'dateRequested', 'requestorName', 'subsidiary', 'driver', 'vehicle', 'plateNumber',
    'etdOffice', 'etaDestination', 'dateTimeDeparture', 'dateTimeReturn', 'passengersDetail',
    'destination', 'purpose', 'medium', 'requestedBy', 'endorsedBy', 'approvedBy',
    'layout', 'status', 'guardIn', 'guardOut', 'kmIn', 'kmOut',
    'hdiPassengers', 'outsidePassengers', 'passengerCount'
  ];

  const data = {};
  allowedFields.forEach(field => {
    if (ticketData[field] !== undefined) {
      data[field] = ticketData[field];
    }
  });

  if (data.etdOffice && data.etaDestination) {
    const occupied = await getOccupiedResources(data.etdOffice, data.etaDestination);
    if (data.driver && occupied.some(o => o.driver === data.driver)) {
      throw new Error(`Driver ${data.driver} is already booked for this schedule.`);
    }
    if (data.vehicle && occupied.some(o => o.vehicle === data.vehicle)) {
      throw new Error(`Vehicle ${data.vehicle} is already booked for this schedule.`);
    }
  }

  return await prisma.tripTicket.create({
    data: {
      ...data,
      layout: data.layout || null,
      authorId: userId
    }
  });
};

const getTickets = async (userId, canApprove, isGuard = false) => {
  const where = (canApprove || isGuard) ? {} : { authorId: userId };
  return await prisma.tripTicket.findMany({
    where,
    include: { author: { select: { name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const getDriverSchedule = async (driverName, isAdmin) => {
  const where = isAdmin ? {} : { driver: driverName };
  return await prisma.tripTicket.findMany({
    where: {
      ...where,
      status: { in: ['Approved', 'Completed', 'Ongoing'] } // Added 'Ongoing'
    },
    include: { author: { select: { name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const getTicketById = async (id) => {
  return await prisma.tripTicket.findUnique({
    where: { id: parseInt(id) }
  });
};

const updateTicket = async (id, data) => {
  // Strict whitelist of fields allowed in the database
  const allowedFields = [
    'dateRequested', 'requestorName', 'subsidiary', 'driver', 'vehicle', 'plateNumber',
    'etdOffice', 'etaDestination', 'dateTimeDeparture', 'dateTimeReturn', 'passengersDetail',
    'destination', 'purpose', 'medium', 'requestedBy', 'endorsedBy', 'approvedBy',
    'layout', 'status', 'guardIn', 'guardOut', 'kmIn', 'kmOut',
    'hdiPassengers', 'outsidePassengers', 'passengerCount', 'archivedBy', 'disapprovalReason'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  if (updateData.etdOffice && updateData.etaDestination) {
    const occupied = await getOccupiedResources(updateData.etdOffice, updateData.etaDestination);
    const conflicts = occupied.filter(o => o.id !== parseInt(id));

    if (updateData.driver && conflicts.some(o => o.driver === updateData.driver)) {
      throw new Error(`Driver ${updateData.driver} is already booked for this schedule.`);
    }
    if (updateData.vehicle && conflicts.some(o => o.vehicle === updateData.vehicle)) {
      throw new Error(`Vehicle ${updateData.vehicle} is already booked for this schedule.`);
    }
  }

  return await prisma.tripTicket.update({
    where: { id: parseInt(id) },
    data: updateData
  });
};

const deleteTicket = async (id) => {
  return await prisma.tripTicket.delete({
    where: { id: parseInt(id) }
  });
};

const getOccupiedResources = async (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  return await prisma.tripTicket.findMany({
    where: {
      // Include all active trip statuses in conflict detection
      status: { in: ['Approved', 'Ongoing', 'DEPARTED'] },
      AND: [
        { etdOffice: { lte: endDate } },
        { etaDestination: { gte: startDate } }
      ]
    },
    select: {
      id: true,
      driver: true,
      vehicle: true
    }
  });
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getDriverSchedule, getOccupiedResources };
