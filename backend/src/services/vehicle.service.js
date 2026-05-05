const prisma = require('../config/database');

const createVehicle = async (data) => {
  return await prisma.vehicle.create({
    data: { 
      name: data.name, 
      plateNumber: data.plateNumber,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      fuelType: data.fuelType,
      transmission: data.transmission,
      engineNumber: data.engineNumber,
      chassisNumber: data.chassisNumber,
      status: data.status || 'Active'
    }
  });
};

const getVehicles = async () => {
  return await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

const updateVehicle = async (id, data) => {
  return await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      plateNumber: data.plateNumber,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      fuelType: data.fuelType,
      transmission: data.transmission,
      engineNumber: data.engineNumber,
      chassisNumber: data.chassisNumber,
      status: data.status
    }
  });
};

const deleteVehicle = async (id) => {
  return await prisma.vehicle.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = { createVehicle, getVehicles, updateVehicle, deleteVehicle };
