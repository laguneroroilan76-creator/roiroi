const prisma = require('../config/database');

const createTicket = async (userId, ticketData) => {
  if (ticketData.etdOffice && ticketData.etaDestination) {
    const occupied = await getOccupiedResources(ticketData.etdOffice, ticketData.etaDestination);
    if (ticketData.driver && occupied.some(o => o.driver === ticketData.driver)) {
      throw new Error(`Driver ${ticketData.driver} is already booked for this schedule.`);
    }
    if (ticketData.vehicle && occupied.some(o => o.vehicle === ticketData.vehicle)) {
      throw new Error(`Vehicle ${ticketData.vehicle} is already booked for this schedule.`);
    }
  }

  return await prisma.tripTicket.create({
    data: {
      ...ticketData,
      layout: ticketData.layout || null,
      authorId: userId
    }
  });
};

const getTickets = async (userId, canApprove, isGuard = false) => {
  const where = (canApprove || isGuard) ? {} : { authorId: userId };
  return await prisma.tripTicket.findMany({ 
    where,
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' } 
  });
};

const getDriverSchedule = async (driverName, isAdmin) => {
  const where = isAdmin ? {} : { driver: driverName };
  return await prisma.tripTicket.findMany({
    where: {
      ...where,
      status: { in: ['Approved', 'Completed'] } // Only show approved/ongoing/completed trips
    },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const getTicketById = async (id) => {
  return await prisma.tripTicket.findUnique({
    where: { id: parseInt(id) }
  });
};

const updateTicket = async (id, data) => {
  const { 
    id: _id, 
    createdAt, 
    authorId, 
    layout, 
    author, 
    type, 
    displayType, 
    docType,
    ...rest 
  } = data;

  if (rest.etdOffice && rest.etaDestination) {
    const occupied = await getOccupiedResources(rest.etdOffice, rest.etaDestination);
    // Filter out the current ticket from conflicts
    const conflicts = occupied.filter(o => o.id !== parseInt(id));
    
    if (rest.driver && conflicts.some(o => o.driver === rest.driver)) {
      throw new Error(`Driver ${rest.driver} is already booked for this schedule.`);
    }
    if (rest.vehicle && conflicts.some(o => o.vehicle === rest.vehicle)) {
      throw new Error(`Vehicle ${rest.vehicle} is already booked for this schedule.`);
    }
  }

  return await prisma.tripTicket.update({
    where: { id: parseInt(id) },
    data: {
      ...rest,
      layout: layout || undefined
    }
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
      status: { in: ['Approved'] },
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
