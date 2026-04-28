const prisma = require('../config/database');

const getTasks = async (userId) => {
  return await prisma.task.findMany({ where: { userId } });
};

const createTask = async (userId, data) => {
  return await prisma.task.create({
    data: { ...data, userId }
  });
};

const updateTask = async (id, data) => {
  return await prisma.task.update({
    where: { id: parseInt(id) },
    data
  });
};

const deleteTask = async (id) => {
    return await prisma.task.delete({ where: { id: parseInt(id) } });
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
