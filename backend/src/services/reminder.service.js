const prisma = require('../config/database');

const getReminders = async (userId) => {
  return await prisma.reminder.findMany({ where: { userId } });
};

const upsertReminder = async (userId, data) => {
  const { id, ...rest } = data;

  // Convert date strings to Date objects for DateTime schema fields
  if (rest.date) rest.date = new Date(rest.date);
  if (rest.endDate) rest.endDate = new Date(rest.endDate);
  else rest.endDate = null;

  return await prisma.reminder.upsert({
    where: { id: id || 0 },
    update: { ...rest },
    create: { ...rest, userId }
  });
};

const deleteReminder = async (id) => {
  return await prisma.reminder.delete({ where: { id: parseInt(id) } });
};

module.exports = { getReminders, upsertReminder, deleteReminder };
