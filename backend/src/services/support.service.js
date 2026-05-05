const prisma = require('../config/database');

const createTicket = async (userId, ticketData) => {
  return await prisma.supportTicket.create({
    data: {
      ...ticketData,
      authorId: parseInt(userId),
    },
    include: { author: { select: { name: true, email: true } } }
  });
};

const getTickets = async (userId, role) => {
  // IT and Admin see all tickets
  const isIT = role === 'IT' || role === 'Admin';
  const where = isIT ? {} : { authorId: parseInt(userId) };
  
  return await prisma.supportTicket.findMany({
    where,
    include: { 
      author: { select: { name: true, email: true, avatarUrl: true } },
      assignedTo: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getTicketById = async (id) => {
  return await prisma.supportTicket.findUnique({
    where: { id: parseInt(id) },
    include: { 
      author: { select: { name: true, email: true, avatarUrl: true } },
      assignedTo: { select: { name: true, email: true } }
    }
  });
};

const updateTicket = async (id, data) => {
  const updateData = { ...data };
  if (data.status === 'Resolved') {
    updateData.resolvedAt = new Date();
  }
  
  return await prisma.supportTicket.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: { 
      author: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } }
    }
  });
};

const deleteTicket = async (id) => {
  return await prisma.supportTicket.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket };
