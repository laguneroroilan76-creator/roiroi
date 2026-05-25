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

const getTickets = async (userId, role, hasSupportAccess = false) => {
  // IT, Admin, and users with Support permissions see all tickets
  const canSeeAll = role === 'IT' || role === 'Admin' || hasSupportAccess;
  const where = canSeeAll ? {} : { authorId: parseInt(userId) };
  
  return await prisma.supportTicket.findMany({
    where,
    include: { 
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getTicketById = async (id) => {
  return await prisma.supportTicket.findUnique({
    where: { id: parseInt(id) },
    include: { 
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } }
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
      assignedTo: { select: { name: true, email: true } },
      resolvedBy: { select: { name: true, email: true } }
    }
  });
};

const deleteTicket = async (id) => {
  return await prisma.supportTicket.delete({
    where: { id: parseInt(id) }
  });
};

const getMessages = async (ticketId) => {
  return await prisma.supportMessage.findMany({
    where: { ticketId: parseInt(ticketId) },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
};

const addMessage = async (ticketId, senderId, message) => {
  return await prisma.supportMessage.create({
    data: {
      ticketId: parseInt(ticketId),
      senderId: parseInt(senderId),
      message
    },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } }
    }
  });
};

module.exports = { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, getMessages, addMessage };
