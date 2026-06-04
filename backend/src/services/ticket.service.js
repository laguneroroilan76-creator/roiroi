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

/**
 * Defense-in-depth: requestingUser is passed from the controller.
 */
const getTicketById = async (id, requestingUser) => {
  const ticket = await prisma.tripTicket.findUnique({
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

  if (!ticket) return null;

  if (requestingUser) {
    const isAdmin = requestingUser.role === 'Admin';
    const isAuthor = ticket.authorId === requestingUser.id;
    const hasFlag = !!(requestingUser.canApproveTripTicket || requestingUser.canEndorse || requestingUser.canApprove || requestingUser.role === 'Guard');
    if (!isAdmin && !isAuthor && !hasFlag) {
      const err = new Error('Access denied: insufficient permissions.');
      err.statusCode = 403;
      throw err;
    }
  }

  return ticket;
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
