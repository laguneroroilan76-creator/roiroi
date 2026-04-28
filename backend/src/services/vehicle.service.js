const prisma = require('../config/database');

const createVehicle = async (data) => {
  return await prisma.vehicle.create({
    data: { name: data.name, plateNumber: data.plateNumber }
  });
};

const getVehicles = async () => {
  return await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

const updateVehicleStatus = async (id, status) => {
  return await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: { status }
  });
};

const deleteVehicle = async (id) => {
  return await prisma.vehicle.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createVehicle, getVehicles, updateVehicleStatus, deleteVehicle };
