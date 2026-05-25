const prisma = require('../config/database');

const createDriver = async (data) => {
  return await prisma.driver.create({
    data: { name: data.name }
  });
};

const getDrivers = async () => {
  return await prisma.user.findMany({
    where: { role: 'Driver' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true }
  });
};

const updateDriverStatus = async (id, status) => {
  return await prisma.driver.update({
    where: { id: parseInt(id) },
    data: { status }
  });
};

const deleteDriver = async (id) => {
  return await prisma.driver.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createDriver, getDrivers, updateDriverStatus, deleteDriver };
