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
    select: { id: true, name: true, email: true, status: true, inactiveReason: true }
  });
};

const updateDriverStatus = async (id, data) => {
  return await prisma.user.update({
    where: { id: parseInt(id) },
    data: { 
        status: data.status,
        inactiveReason: data.inactiveReason || null
    }
  });
};

const deleteDriver = async (id) => {
  return await prisma.user.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createDriver, getDrivers, updateDriverStatus, deleteDriver };
