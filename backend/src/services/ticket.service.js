const prisma = require('../config/database');

const getTickets = async (userId, canApprove, isGuard = false) => {
  const where = (canApprove || isGuard) ? {} : { authorId: userId };
  return await prisma.tripTicket.findMany({
    where,
    include: { 
      author: { select: { name: true, avatarUrl: true, company: true } },
      driverUser: { select: { name: true } },
      requestor: { select: { name: true } },
      requestedBy: { select: { name: true } },
      endorsedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      guardOutUser: { select: { name: true } },
      guardInUser: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getDriverSchedule = async (driverName, isAdmin) => {
  const where = isAdmin ? {} : { driverUser: { name: driverName } };
  return await prisma.tripTicket.findMany({
    where: {
      ...where,
      status: { in: ['Approved', 'Completed', 'Ongoing'] }
    },
    include: { 
      author: { select: { name: true, avatarUrl: true, company: true } },
      driverUser: { select: { name: true } },
      requestedBy: { select: { name: true } },
      endorsedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      guardOutUser: { select: { name: true } },
      guardInUser: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getTicketById = async (id) => {
  return await prisma.tripTicket.findUnique({
    where: { id: parseInt(id) },
    include: { 
      author: { select: { name: true, avatarUrl: true, company: true } },
      driverUser: { select: { name: true } },
      requestor: { select: { name: true } },
      requestedBy: { select: { name: true } },
      endorsedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      guardOutUser: { select: { name: true } },
      guardInUser: { select: { name: true } }
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
  // Make sure dates are parsed to DateTime if they are strings
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return await prisma.tripTicket.findMany({
    where: {
      status: { in: ['Approved', 'Ongoing', 'DEPARTED'] },
      AND: [
        { etdOffice: { lte: end.toISOString() } },
        { etaDestination: { gte: start.toISOString() } }
      ]
    },
    select: {
      id: true,
      driverId: true,
      vehicle: true,
      driverUser: { select: { name: true } }
    }
  });
};

module.exports = { getTickets, getTicketById, deleteTicket, getDriverSchedule, getOccupiedResources };
