const prisma = require('../config/database');

const createTicket = async (userId, ticketData) => {
  return await prisma.tripTicket.create({
    data: {
      ...ticketData,
      layout: ticketData.layout || null,
      authorId: userId
    }
  });
};

const getTickets = async () => {
  return await prisma.tripTicket.findMany({ 
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
  // Destructure to remove fields that don't exist in Prisma model or are immutable
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

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket };
